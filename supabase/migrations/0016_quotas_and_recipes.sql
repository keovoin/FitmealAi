-- =============================================================================
-- 0016_quotas_and_recipes.sql
-- Phase 5: recipe catalog + admin-tunable per-tier daily quotas (AI generations
-- and catalog shuffles), plus the data shape behind the new pricing offers
-- (free trial + first-payment discount per tier).
--
-- Idempotent on re-run.
--
-- New tables:
--   - recipes             : catalog of curated/AI-generated meals
--   - user_daily_quotas   : per-user / per-day counter for AI gens + shuffles
--
-- Existing function rewritten:
--   - check_ai_rate_limit : reads daily caps from app_settings instead of the
--                           hardcoded 20/50/100 from migration 0008. Falls
--                           back to the new defaults (free 1, silver 20,
--                           gold 30) when a setting row is missing.
--
-- New app_settings rows seeded:
--   - quotas.free.ai_per_day              = 1
--   - quotas.free.shuffles_per_day        = 10
--   - quotas.silver.ai_per_day            = 20
--   - quotas.silver.shuffles_per_day      = -1   (-1 = unlimited)
--   - quotas.gold.ai_per_day               = 30
--   - quotas.gold.shuffles_per_day        = -1
--   - quotas.shuffle_meal_count            = 1   (recipes returned per shuffle)
--   - quotas.catalog_min_published_per_meal_type = 5
--   - pricing.silver.trial.enabled         = false
--   - pricing.silver.trial.days            = 3
--   - pricing.silver.trial.audience        = "first_time"
--   - pricing.silver.discount.enabled      = false
--   - pricing.silver.discount.percent_off  = 50
--   - pricing.silver.discount.audience     = "first_time"
--   - pricing.silver.discount.country      = ""
--   - pricing.silver.discount.starts_at    = null
--   - pricing.silver.discount.ends_at      = null
--   - pricing.gold.trial.* / pricing.gold.discount.* (mirrors of the above)
-- =============================================================================

-- Recipe catalog -----------------------------------------------------------
create table if not exists public.recipes (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               text not null,
  description         text,
  meal_type           meal_type not null,
  diets               text[] not null default '{}'::text[],
  allergens           text[] not null default '{}'::text[],
  tags                text[] not null default '{}'::text[],
  cook_time_minutes   integer,
  calories            integer not null default 0,
  protein_g           integer not null default 0,
  carbs_g             integer not null default 0,
  fat_g               integer not null default 0,
  ingredients         jsonb not null default '[]'::jsonb,
  recipe_steps        jsonb not null default '[]'::jsonb,
  image_url           text,
  thumbnail_url       text,
  source              text not null default 'curated'
                       check (source in ('ai_generated','curated','imported')),
  status              text not null default 'draft'
                       check (status in ('draft','published','archived')),
  popularity_score    integer not null default 0,
  view_count          integer not null default 0,
  like_count          integer not null default 0,
  created_by          uuid references auth.users(id),
  approved_by         uuid references auth.users(id),
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists recipes_status_idx     on public.recipes(status);
create index if not exists recipes_meal_type_idx  on public.recipes(meal_type);
create index if not exists recipes_source_idx     on public.recipes(source);
create index if not exists recipes_published_idx
  on public.recipes(meal_type, status)
  where status = 'published';

create or replace function public.recipes_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists recipes_touch_updated_at on public.recipes;
create trigger recipes_touch_updated_at
  before update on public.recipes
  for each row execute function public.recipes_touch_updated_at();

alter table public.recipes enable row level security;

-- Mobile clients (anon + authenticated) can only see published rows.
drop policy if exists recipes_public_read on public.recipes;
create policy recipes_public_read on public.recipes
  for select using (status = 'published');

-- Service role has full access (admin pages + API routes go through it).
drop policy if exists recipes_service on public.recipes;
create policy recipes_service on public.recipes
  for all to service_role using (true) with check (true);

-- Per-user daily counters ---------------------------------------------------
create table if not exists public.user_daily_quotas (
  user_id              uuid not null references auth.users(id) on delete cascade,
  day                  date not null default (now() at time zone 'utc')::date,
  ai_used              integer not null default 0,
  shuffles_used        integer not null default 0,
  updated_at           timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists user_daily_quotas_day_idx on public.user_daily_quotas(day);

alter table public.user_daily_quotas enable row level security;

drop policy if exists user_daily_quotas_own on public.user_daily_quotas;
create policy user_daily_quotas_own on public.user_daily_quotas
  for select using (auth.uid() = user_id);

drop policy if exists user_daily_quotas_service on public.user_daily_quotas;
create policy user_daily_quotas_service on public.user_daily_quotas
  for all to service_role using (true) with check (true);

-- Helper: read an integer setting from app_settings, with a default ---------
create or replace function public.app_setting_int(p_key text, p_default integer)
returns integer
language sql
stable
as $$
  select coalesce(
    nullif((select value::text from public.app_settings where key = p_key), 'null')::integer,
    p_default
  );
$$;

-- Convenience: per-tier AI daily limit from app_settings -------------------
create or replace function public.tier_ai_daily_limit(p_tier subscription_tier)
returns integer
language sql
stable
as $$
  select case p_tier
    when 'free'   then app_setting_int('quotas.free.ai_per_day',   1)
    when 'silver' then app_setting_int('quotas.silver.ai_per_day', 20)
    when 'gold'   then app_setting_int('quotas.gold.ai_per_day',   30)
    else 1
  end;
$$;

-- Convenience: per-tier shuffle daily limit (-1 = unlimited) ---------------
create or replace function public.tier_shuffle_daily_limit(p_tier subscription_tier)
returns integer
language sql
stable
as $$
  select case p_tier
    when 'free'   then app_setting_int('quotas.free.shuffles_per_day',   10)
    when 'silver' then app_setting_int('quotas.silver.shuffles_per_day', -1)
    when 'gold'   then app_setting_int('quotas.gold.shuffles_per_day',   -1)
    else 10
  end;
$$;

-- Re-implement check_ai_rate_limit so it uses the new tunable caps ---------
-- (replaces the version installed by migration 0008).
create or replace function public.check_ai_rate_limit(
  p_user_id uuid,
  p_kind    ai_generation_kind default 'meal_plan'
)
returns table (
  allowed              boolean,
  reason               text,
  retry_after_seconds  integer,
  daily_used           integer,
  daily_limit          integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier         subscription_tier;
  v_daily_limit  integer;
  v_daily_used   integer;
begin
  select tier into v_tier from public.profiles where id = p_user_id;
  if v_tier is null then v_tier := 'free'; end if;

  v_daily_limit := tier_ai_daily_limit(v_tier);

  -- Count today's chargeable AI generations (cache_hit = false / null).
  select count(*) into v_daily_used
    from public.ai_generations
   where user_id = p_user_id
     and kind = p_kind
     and (cache_hit is null or cache_hit = false)
     and created_at >= (now() at time zone 'utc')::date;

  if v_daily_used >= v_daily_limit then
    return query
      select false,
             'daily_cap_reached'::text,
             extract(epoch from (((now() at time zone 'utc')::date + 1)::timestamptz - now()))::int,
             v_daily_used,
             v_daily_limit;
    return;
  end if;

  return query
    select true,
           null::text,
           0,
           v_daily_used,
           v_daily_limit;
end;
$$;

-- Atomic counter bump used by /api/recipes/shuffle and friends -------------
create or replace function public.bump_quota(
  p_user_id uuid,
  p_kind    text                   -- 'ai' | 'shuffle'
)
returns table (
  used  integer,
  cap   integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_tier  subscription_tier;
  v_cap   integer;
  v_used  integer;
begin
  select tier into v_tier from public.profiles where id = p_user_id;
  if v_tier is null then v_tier := 'free'; end if;

  if p_kind = 'ai' then
    v_cap := tier_ai_daily_limit(v_tier);
  elsif p_kind = 'shuffle' then
    v_cap := tier_shuffle_daily_limit(v_tier);
  else
    raise exception 'bump_quota: unknown kind %', p_kind;
  end if;

  insert into public.user_daily_quotas (user_id, day, ai_used, shuffles_used)
  values (
    p_user_id, v_today,
    case when p_kind = 'ai' then 1 else 0 end,
    case when p_kind = 'shuffle' then 1 else 0 end
  )
  on conflict (user_id, day) do update
    set ai_used       = public.user_daily_quotas.ai_used
                        + case when p_kind = 'ai' then 1 else 0 end,
        shuffles_used = public.user_daily_quotas.shuffles_used
                        + case when p_kind = 'shuffle' then 1 else 0 end,
        updated_at    = now()
  returning case when p_kind = 'ai' then ai_used else shuffles_used end into v_used;

  return query select v_used, v_cap;
end;
$$;

-- Seed admin-tunable quota + pricing rows (defaults match the spec) --------
insert into public.app_settings(key, value, description) values
  ('quotas.free.ai_per_day',                '1'::jsonb,
     'Free tier: AI meal plan generations per day.'),
  ('quotas.free.shuffles_per_day',          '10'::jsonb,
     'Free tier: catalog shuffles per day across all meal slots.'),
  ('quotas.silver.ai_per_day',              '20'::jsonb,
     'Silver tier: AI meal plan generations per day.'),
  ('quotas.silver.shuffles_per_day',        '-1'::jsonb,
     'Silver tier: catalog shuffles per day. -1 means unlimited.'),
  ('quotas.gold.ai_per_day',                '30'::jsonb,
     'Gold tier: AI meal plan generations per day.'),
  ('quotas.gold.shuffles_per_day',          '-1'::jsonb,
     'Gold tier: catalog shuffles per day. -1 means unlimited.'),
  ('quotas.shuffle_meal_count',             '1'::jsonb,
     'How many recipes a single shuffle returns.'),
  ('quotas.catalog_min_published_per_meal_type', '5'::jsonb,
     'Hide the mobile Shuffle button until at least this many published recipes exist for the user''s requested meal_type.'),

  ('pricing.silver.trial.enabled',          'false'::jsonb,
     'Whether to offer a free trial period for Silver before first charge.'),
  ('pricing.silver.trial.days',             '3'::jsonb,
     'Length of the Silver free trial in days when enabled.'),
  ('pricing.silver.trial.audience',         '"first_time"'::jsonb,
     'first_time = users without any prior paid subscription. everyone = anyone.'),
  ('pricing.silver.discount.enabled',       'false'::jsonb,
     'Whether to apply a first-payment discount on Silver.'),
  ('pricing.silver.discount.percent_off',   '50'::jsonb,
     'Percent off the first Silver payment when discount is enabled.'),
  ('pricing.silver.discount.audience',      '"first_time"'::jsonb,
     'first_time | everyone | by_country.'),
  ('pricing.silver.discount.country',       '""'::jsonb,
     'ISO-3166-1 alpha-2. Only used when audience = by_country.'),
  ('pricing.silver.discount.starts_at',     'null'::jsonb,
     'ISO-8601 timestamp. null = always available while enabled.'),
  ('pricing.silver.discount.ends_at',       'null'::jsonb,
     'ISO-8601 timestamp. null = no end date.'),

  ('pricing.gold.trial.enabled',            'false'::jsonb,
     'Whether to offer a free trial period for Gold before first charge.'),
  ('pricing.gold.trial.days',               '0'::jsonb,
     'Length of the Gold free trial in days when enabled.'),
  ('pricing.gold.trial.audience',           '"first_time"'::jsonb,
     'first_time = users without any prior paid subscription. everyone = anyone.'),
  ('pricing.gold.discount.enabled',         'false'::jsonb,
     'Whether to apply a first-payment discount on Gold.'),
  ('pricing.gold.discount.percent_off',     '50'::jsonb,
     'Percent off the first Gold payment when discount is enabled.'),
  ('pricing.gold.discount.audience',        '"first_time"'::jsonb,
     'first_time | everyone | by_country.'),
  ('pricing.gold.discount.country',         '""'::jsonb,
     'ISO-3166-1 alpha-2. Only used when audience = by_country.'),
  ('pricing.gold.discount.starts_at',       'null'::jsonb, ''),
  ('pricing.gold.discount.ends_at',         'null'::jsonb, '')
on conflict (key) do nothing;
