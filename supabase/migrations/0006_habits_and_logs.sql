-- =============================================================================
-- 0006_habits_and_logs.sql
-- Each user defines habits (drink water, sleep 8h, etc).
-- habit_logs: one row per habit per day. UNIQUE constraint enforces the
-- "one log per day" rule from the product brief.
-- =============================================================================

create table if not exists public.habits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  icon_system_name text not null default 'checkmark.circle',
  position        int  not null default 0,
  archived_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists habits_user_idx on public.habits (user_id, position);
create index if not exists habits_active_idx
  on public.habits (user_id) where archived_at is null;

create table if not exists public.habit_logs (
  id            uuid primary key default gen_random_uuid(),
  habit_id      uuid not null references public.habits(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  log_date      date not null,
  is_completed  boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index if not exists habit_logs_user_date_idx
  on public.habit_logs (user_id, log_date desc);

-- Convenience view: current streak per habit, recomputed on-the-fly.
create or replace view public.v_habit_streaks as
with completed_dates as (
  select habit_id, log_date
  from public.habit_logs
  where is_completed = true
),
gaps as (
  select
    habit_id,
    log_date,
    log_date - (row_number() over (partition by habit_id order by log_date))::int as grp
  from completed_dates
),
runs as (
  select habit_id, max(log_date) as last_date, count(*) as run_length
  from gaps
  group by habit_id, grp
)
select distinct on (habit_id)
  habit_id,
  run_length as streak_days,
  last_date
from runs
order by habit_id, last_date desc;
