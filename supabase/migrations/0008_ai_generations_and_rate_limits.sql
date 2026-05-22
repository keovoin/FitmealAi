-- =============================================================================
-- 0008_ai_generations_and_rate_limits.sql
-- ai_generations: every text/image AI call logged for cost tracking and
--                 rate-limit enforcement.
-- check_ai_rate_limit(): enforces the per-tier rules from the product brief:
--   free   -> 3 immediate, then 1 per 30 min, daily cap 20
--   silver -> daily cap 50
--   gold   -> daily cap 100
-- The next.js api route calls this BEFORE every AI request, and inserts
-- the row AFTER. Free-tier "1 per 30 min" is enforced by tracking the
-- last successful generation timestamp.
-- =============================================================================

create table if not exists public.ai_generations (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  kind                 ai_generation_kind not null,
  -- 'meal_plan' generations link to the produced plan, image gens link to a meal.
  meal_plan_id         uuid references public.meal_plans(id) on delete set null,
  meal_id              uuid references public.meals(id) on delete set null,
  model                text not null,                -- e.g. 'gpt-4o-mini'
  input_tokens         int  default 0,
  output_tokens        int  default 0,
  cost_usd_micro       int  default 0,              -- 1 = $0.000001, rounded
  request_id           text,
  cache_hit            boolean not null default false,
  succeeded            boolean not null default true,
  error_code           text,
  created_at           timestamptz not null default now()
);

create index if not exists ai_generations_user_idx
  on public.ai_generations (user_id, created_at desc);

create index if not exists ai_generations_user_kind_idx
  on public.ai_generations (user_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Rate-limit checker. Returns an outcome row instead of raising so the API
-- can return a friendly 429 with retry_after seconds.
-- ---------------------------------------------------------------------------
create or replace function public.check_ai_rate_limit(
  p_user_id uuid,
  p_kind    ai_generation_kind default 'meal_plan'
)
returns table (
  allowed     boolean,
  reason      text,
  retry_after_seconds int,
  daily_used  int,
  daily_limit int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier        subscription_tier;
  v_daily_limit int;
  v_daily_used  int;
  v_today_count int;
  v_recent_count int;
  v_last_at     timestamptz;
  v_secs_since  int;
begin
  -- Look up the user's tier. We do NOT count cache_hit rows against the
  -- limit because no AI call actually happened.
  select tier into v_tier from public.profiles where id = p_user_id;
  if v_tier is null then
    return query select false, 'profile_not_found'::text, 0, 0, 0;
    return;
  end if;

  v_daily_limit := case v_tier
    when 'free'   then 20
    when 'silver' then 50
    when 'gold'   then 100
  end;

  select count(*) into v_today_count
  from public.ai_generations
  where user_id = p_user_id
    and kind = p_kind
    and succeeded = true
    and cache_hit = false
    and created_at >= (now() at time zone 'utc')::date;

  v_daily_used := v_today_count;

  if v_today_count >= v_daily_limit then
    return query
      select false,
             'daily_cap_reached'::text,
             extract(epoch from (((now() at time zone 'utc')::date + 1)::timestamptz - now()))::int,
             v_daily_used,
             v_daily_limit;
    return;
  end if;

  -- Free-tier "1 per 30 min after first 3" rule.
  if v_tier = 'free' and v_today_count >= 3 then
    select max(created_at) into v_last_at
    from public.ai_generations
    where user_id = p_user_id
      and kind = p_kind
      and succeeded = true
      and cache_hit = false
      and created_at >= (now() at time zone 'utc')::date;

    if v_last_at is not null then
      v_secs_since := extract(epoch from (now() - v_last_at))::int;
      if v_secs_since < 1800 then
        return query
          select false, 'cooldown'::text, 1800 - v_secs_since, v_daily_used, v_daily_limit;
        return;
      end if;
    end if;
  end if;

  return query select true, 'ok'::text, 0, v_daily_used, v_daily_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lookup-or-insert helper for the meal cache. The API calls this with the
-- meal slug and the freshly-generated row data. If a meal with the same
-- slug already exists, we return that one and skip image generation. The
-- caller can check `was_inserted` to know whether to enqueue an image job.
-- ---------------------------------------------------------------------------
create or replace function public.upsert_meal_by_slug(
  p_slug         text,
  p_title        text,
  p_meal_type    meal_type,
  p_calories     int,
  p_protein_g    int,
  p_carbs_g      int,
  p_fat_g        int,
  p_ingredients  jsonb,
  p_recipe_steps jsonb,
  p_model        text
)
returns table (
  meal_id      uuid,
  was_inserted boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
begin
  select id into v_existing_id from public.meals where slug = p_slug;

  if v_existing_id is not null then
    return query select v_existing_id, false;
    return;
  end if;

  insert into public.meals (
    slug, title, meal_type, calories,
    protein_g, carbs_g, fat_g,
    ingredients, recipe_steps, generated_by_model
  ) values (
    p_slug, p_title, p_meal_type, p_calories,
    p_protein_g, p_carbs_g, p_fat_g,
    p_ingredients, p_recipe_steps, p_model
  )
  returning id into v_existing_id;

  return query select v_existing_id, true;
end;
$$;
