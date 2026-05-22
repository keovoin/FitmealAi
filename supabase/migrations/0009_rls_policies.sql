-- =============================================================================
-- 0009_rls_policies.sql
-- Row Level Security: each user reads/writes only their own rows.
-- The service role used by the admin web bypasses RLS entirely, so admin
-- pages can read everyone's data without per-row policies.
-- =============================================================================

-- Helper: allow public read on shared lookup data (the meal pool).
-- All other tables are user-scoped.

alter table public.profiles         enable row level security;
alter table public.user_goals       enable row level security;
alter table public.meal_prefs       enable row level security;
alter table public.workout_prefs    enable row level security;
alter table public.meals            enable row level security;
alter table public.meal_plans       enable row level security;
alter table public.meal_plan_items  enable row level security;
alter table public.workout_plans    enable row level security;
alter table public.exercises        enable row level security;
alter table public.habits           enable row level security;
alter table public.habit_logs       enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.payment_requests enable row level security;
alter table public.ai_generations   enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: user reads/updates own row
-- ---------------------------------------------------------------------------
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self update" on public.profiles;

create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Per-user singleton tables (user_goals, meal_prefs, workout_prefs)
-- ---------------------------------------------------------------------------
drop policy if exists "user_goals self all"   on public.user_goals;
create policy "user_goals self all"
  on public.user_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "meal_prefs self all" on public.meal_prefs;
create policy "meal_prefs self all"
  on public.meal_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workout_prefs self all" on public.workout_prefs;
create policy "workout_prefs self all"
  on public.workout_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- meals: shared lookup. Every authenticated user can read.
-- Inserts/updates happen via service role only (the AI endpoint).
-- ---------------------------------------------------------------------------
drop policy if exists "meals public read" on public.meals;
create policy "meals public read"
  on public.meals for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- meal_plans + meal_plan_items: user owns the plan; items inherit ownership
-- ---------------------------------------------------------------------------
drop policy if exists "meal_plans self all" on public.meal_plans;
create policy "meal_plans self all"
  on public.meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "meal_plan_items self all" on public.meal_plan_items;
create policy "meal_plan_items self all"
  on public.meal_plan_items for all
  using (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_items.meal_plan_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_items.meal_plan_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- workout_plans + exercises: same pattern as meal_plans
-- ---------------------------------------------------------------------------
drop policy if exists "workout_plans self all" on public.workout_plans;
create policy "workout_plans self all"
  on public.workout_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "exercises self all" on public.exercises;
create policy "exercises self all"
  on public.exercises for all
  using (
    exists (
      select 1 from public.workout_plans p
      where p.id = exercises.workout_plan_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans p
      where p.id = exercises.workout_plan_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Habits + logs
-- ---------------------------------------------------------------------------
drop policy if exists "habits self all" on public.habits;
create policy "habits self all"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "habit_logs self all" on public.habit_logs;
create policy "habit_logs self all"
  on public.habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Subscriptions: user can read their own, but only service role can insert
-- (because subscription state must come from a verified payment flow).
-- ---------------------------------------------------------------------------
drop policy if exists "subscriptions self read" on public.subscriptions;
create policy "subscriptions self read"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Payment requests: user creates their own and can read it; updates (review
-- decisions) come from service role only.
-- ---------------------------------------------------------------------------
drop policy if exists "payment_requests self read"   on public.payment_requests;
drop policy if exists "payment_requests self insert" on public.payment_requests;

create policy "payment_requests self read"
  on public.payment_requests for select
  using (auth.uid() = user_id);

create policy "payment_requests self insert"
  on public.payment_requests for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ai_generations: user can read their own (for "you have N regens left"
-- displays) but only service role can insert (the API endpoint uses service
-- role for these writes so users can't game the rate limiter).
-- ---------------------------------------------------------------------------
drop policy if exists "ai_generations self read" on public.ai_generations;
create policy "ai_generations self read"
  on public.ai_generations for select
  using (auth.uid() = user_id);
