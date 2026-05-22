-- =============================================================================
-- 0004_meals_and_meal_plans.sql
-- meals  -> shared lookup of AI-generated dishes (image cached once, reused
--           for everyone). Keyed on a normalized title so duplicates collapse.
-- meal_plans -> per-user, per-day plan with versioning via superseded_at.
-- =============================================================================

create table if not exists public.meals (
  id                 uuid primary key default gen_random_uuid(),
  -- Normalized title used for de-duplication. Lowercased + trimmed.
  slug               citext not null unique,
  title              text   not null,
  description        text,
  meal_type          meal_type not null,
  calories           int    not null check (calories >= 0),
  protein_g          int    not null default 0 check (protein_g  >= 0),
  carbs_g            int    not null default 0 check (carbs_g    >= 0),
  fat_g              int    not null default 0 check (fat_g      >= 0),
  ingredients        jsonb  not null default '[]'::jsonb,
  recipe_steps       jsonb  not null default '[]'::jsonb,
  image_storage_path text,             -- relative to the meal-images bucket
  image_url          text,             -- public CDN URL, populated after upload
  generated_by_model text,             -- e.g. 'gpt-4o-mini' / 'gpt-image-1'
  created_at         timestamptz not null default now()
);

create index if not exists meals_meal_type_idx on public.meals (meal_type);
create index if not exists meals_created_at_idx on public.meals (created_at desc);

-- Per-user, per-day meal plan. We keep history by setting superseded_at on
-- the older row when a regeneration happens, instead of deleting.
create table if not exists public.meal_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  -- Phase-1: single-day plans use plan_date; weekly Gold plans use [week_start, week_end].
  plan_date       date not null,
  week_start_date date,
  week_end_date   date,
  generated_at    timestamptz not null default now(),
  superseded_at   timestamptz,
  generated_model text,
  source          text not null default 'ai'  -- 'ai' | 'manual' | 'imported'
);

create index if not exists meal_plans_user_date_idx
  on public.meal_plans (user_id, plan_date desc);

create index if not exists meal_plans_user_active_idx
  on public.meal_plans (user_id, plan_date)
  where superseded_at is null;

-- Join table: which meals belong to which plan, with display ordering and
-- a snapshot of macros at generation time (so admins can audit if a meal
-- row gets edited later).
create table if not exists public.meal_plan_items (
  id            uuid primary key default gen_random_uuid(),
  meal_plan_id  uuid not null references public.meal_plans(id) on delete cascade,
  meal_id       uuid not null references public.meals(id),
  position      int  not null default 0,
  -- Snapshot of macros at the moment this item was added.
  calories      int  not null,
  protein_g     int  not null default 0,
  carbs_g       int  not null default 0,
  fat_g         int  not null default 0
);

create index if not exists meal_plan_items_plan_idx
  on public.meal_plan_items (meal_plan_id, position);
