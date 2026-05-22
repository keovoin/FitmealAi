-- =============================================================================
-- 0002_profiles.sql
-- Public profile per auth user. Created automatically when a user signs up.
-- =============================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         citext not null,
  display_name  text,
  phone         text,
  country       char(2),
  tier          subscription_tier not null default 'free',
  status        user_status       not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_active_at timestamptz
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_tier_idx  on public.profiles (tier);
create index if not exists profiles_status_idx on public.profiles (status);

-- Auto-create a profile row when someone signs up via Supabase Auth.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep updated_at fresh on profile edits.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
