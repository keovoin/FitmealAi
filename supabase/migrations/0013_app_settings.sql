-- =============================================================================
-- 0013_app_settings.sql
-- Generic key/value JSONB settings store, used initially for the ABA payment
-- enable/disable toggle and the country allow-list. Admins read/write through
-- the admin-web service role; mobile clients consume the resolved options
-- through /api/payments/options (read-only, IP-aware).
--
-- Idempotent on re-run.
-- =============================================================================

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb       not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users(id)
);

-- Audit trigger: bump updated_at automatically on every write.
create or replace function public.app_settings_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_settings_touch_updated_at on public.app_settings;
create trigger app_settings_touch_updated_at
  before update on public.app_settings
  for each row execute function public.app_settings_touch_updated_at();

-- Default seed: ABA payment enabled, available only in Cambodia.
insert into public.app_settings(key, value, description) values
  ('aba_payment.enabled',
   'true'::jsonb,
   'Master switch for the manual ABA bank-transfer payment flow.'),
  ('aba_payment.allowed_regions',
   '["KH"]'::jsonb,
   'ISO-3166-1 alpha-2 country codes where the ABA payment button is shown.')
on conflict (key) do nothing;

-- RLS: only the service role (admin) can read/write. Mobile reads come
-- through /api/payments/options, which evaluates server-side and never
-- exposes the raw row.
alter table public.app_settings enable row level security;

drop policy if exists app_settings_service_role_full on public.app_settings;
create policy app_settings_service_role_full
  on public.app_settings
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.app_settings is
  'Admin-controlled feature flags and configuration. Read via service role only.';
