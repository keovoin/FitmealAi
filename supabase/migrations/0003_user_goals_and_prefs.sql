-- =============================================================================
-- 0003_user_goals_and_prefs.sql
-- One-row-per-user state captured during onboarding and editable later.
-- =============================================================================

create table if not exists public.user_goals (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  fitness_goal         fitness_goal not null,
  daily_calorie_target int  not null check (daily_calorie_target > 0),
  weight_kg            numeric(5,2),
  height_cm            numeric(5,2),
  age                  int,
  updated_at           timestamptz not null default now()
);

create table if not exists public.meal_prefs (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  diets       text[]      not null default '{balanced}',
  timings     text[]      not null default '{breakfast,lunch,dinner}',
  cook_time   text        not null default '30 min',
  allergies   text[]      not null default '{}',
  updated_at  timestamptz not null default now()
);

create table if not exists public.workout_prefs (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  types       text[]      not null default '{strength}',
  days        text        not null default '4 days',
  duration    text        not null default '45 min',
  updated_at  timestamptz not null default now()
);

drop trigger if exists user_goals_touch on public.user_goals;
create trigger user_goals_touch before update on public.user_goals
  for each row execute function public.touch_updated_at();

drop trigger if exists meal_prefs_touch on public.meal_prefs;
create trigger meal_prefs_touch before update on public.meal_prefs
  for each row execute function public.touch_updated_at();

drop trigger if exists workout_prefs_touch on public.workout_prefs;
create trigger workout_prefs_touch before update on public.workout_prefs
  for each row execute function public.touch_updated_at();
