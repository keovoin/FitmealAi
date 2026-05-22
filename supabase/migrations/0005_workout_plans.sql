-- =============================================================================
-- 0005_workout_plans.sql
-- Same versioning pattern as meal_plans. Exercises are inline rows because
-- there's no cross-user reuse benefit (yet).
-- =============================================================================

create table if not exists public.workout_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  plan_date         date not null,
  title             text not null,
  estimated_minutes int  not null default 30,
  generated_at      timestamptz not null default now(),
  superseded_at     timestamptz,
  generated_model   text,
  source            text not null default 'ai'
);

create index if not exists workout_plans_user_date_idx
  on public.workout_plans (user_id, plan_date desc);

create index if not exists workout_plans_user_active_idx
  on public.workout_plans (user_id, plan_date)
  where superseded_at is null;

create table if not exists public.exercises (
  id                uuid primary key default gen_random_uuid(),
  workout_plan_id   uuid not null references public.workout_plans(id) on delete cascade,
  position          int  not null default 0,
  name              text not null,
  sets              int  not null default 3 check (sets > 0),
  reps              int  not null default 10 check (reps > 0),
  duration_seconds  int,
  completed_at      timestamptz
);

create index if not exists exercises_plan_idx
  on public.exercises (workout_plan_id, position);
