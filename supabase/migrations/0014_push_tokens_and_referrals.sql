-- =============================================================================
-- 0014_push_tokens_and_referrals.sql
-- Push notification device tokens + referral system tables.
-- Idempotent on re-run.
-- =============================================================================

-- Push tokens ---------------------------------------------------------------
create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  platform    text not null check (platform in ('ios','android','web')),
  token       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, token)
);

create index if not exists push_tokens_user_idx on public.push_tokens(user_id);

-- Notification preferences per user ----------------------------------------
create table if not exists public.notification_prefs (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  meal_plan_ready     boolean not null default true,
  payment_approved    boolean not null default true,
  water_reminder      boolean not null default true,
  workout_reminder    boolean not null default true,
  habit_streak        boolean not null default true,
  weekly_summary      boolean not null default true,
  telegram_linked     boolean not null default false,
  telegram_chat_id    text,
  updated_at          timestamptz not null default now()
);

-- Referrals -----------------------------------------------------------------
create table if not exists public.referral_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade unique,
  code        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references auth.users(id),
  referred_id     uuid not null references auth.users(id),
  -- Device fingerprint to prevent same-device abuse
  device_fingerprint text,
  status          text not null default 'pending' check (status in ('pending','verified','rewarded','rejected')),
  created_at      timestamptz not null default now(),
  verified_at     timestamptz,
  unique(referrer_id, referred_id)
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);
create index if not exists referrals_referred_idx on public.referrals(referred_id);

-- Function: count verified referrals for a user
create or replace function public.count_verified_referrals(p_user_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.referrals
  where referrer_id = p_user_id
    and status in ('verified', 'rewarded');
$$;

-- Function: reward user after 3 verified referrals
create or replace function public.check_and_reward_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if new.status = 'verified' then
    select count_verified_referrals(new.referrer_id) into v_count;
    if v_count >= 3 then
      -- Give 30 days of Gold
      update public.profiles set tier = 'gold' where id = new.referrer_id;
      insert into public.subscriptions (user_id, tier, source, status, monthly_price, started_at, renews_at)
      values (new.referrer_id, 'gold', 'referral', 'active', '$0.00', now(), now() + interval '30 days')
      on conflict do nothing;
      -- Mark all verified referrals as rewarded
      update public.referrals set status = 'rewarded'
      where referrer_id = new.referrer_id and status = 'verified';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists referral_reward_trigger on public.referrals;
create trigger referral_reward_trigger
  after update on public.referrals
  for each row
  when (new.status = 'verified' and old.status != 'verified')
  execute function public.check_and_reward_referral();

-- RLS for push_tokens (users can only manage their own)
alter table public.push_tokens enable row level security;
drop policy if exists push_tokens_own on public.push_tokens;
create policy push_tokens_own on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS for notification_prefs
alter table public.notification_prefs enable row level security;
drop policy if exists notification_prefs_own on public.notification_prefs;
create policy notification_prefs_own on public.notification_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS for referral_codes (users see only their own)
alter table public.referral_codes enable row level security;
drop policy if exists referral_codes_own on public.referral_codes;
create policy referral_codes_own on public.referral_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS for referrals
alter table public.referrals enable row level security;
drop policy if exists referrals_own on public.referrals;
create policy referrals_own on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Service role full access
drop policy if exists push_tokens_service on public.push_tokens;
create policy push_tokens_service on public.push_tokens for all to service_role using (true) with check (true);
drop policy if exists notification_prefs_service on public.notification_prefs;
create policy notification_prefs_service on public.notification_prefs for all to service_role using (true) with check (true);
drop policy if exists referral_codes_service on public.referral_codes;
create policy referral_codes_service on public.referral_codes for all to service_role using (true) with check (true);
drop policy if exists referrals_service on public.referrals;
create policy referrals_service on public.referrals for all to service_role using (true) with check (true);
