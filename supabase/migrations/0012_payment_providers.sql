-- =============================================================================
-- 0012_payment_providers.sql
-- Extends payment_requests so we can support gateway-driven payment flows
-- alongside the existing manual ABA receipt review:
--   - Bakong KHQR (direct)        provider = 'bakong_khqr'
--   - ABA PayWay                   provider = 'aba_payway'
--   - CamRapidPay (managed KHQR)   provider = 'camrapidpay'
--   - Manual ABA bank transfer     provider = 'manual_aba'  (existing flow)
--
-- Idempotent on re-run.
-- =============================================================================

-- Provider enum -------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    create type public.payment_provider as enum (
      'manual_aba',
      'bakong_khqr',
      'aba_payway',
      'camrapidpay'
    );
  end if;
end$$;

-- Add columns to payment_requests ------------------------------------------
alter table public.payment_requests
  add column if not exists provider            public.payment_provider not null default 'manual_aba',
  add column if not exists provider_session_id text,
  add column if not exists qr_payload          text,         -- raw KHQR EMVCo string
  add column if not exists qr_image_url        text,         -- optional cached PNG
  add column if not exists md5_hash            text,         -- bakong reference hash
  add column if not exists currency            text not null default 'USD',
  add column if not exists amount_minor        bigint,       -- e.g. 999 = $9.99
  add column if not exists expires_at          timestamptz,
  add column if not exists last_polled_at      timestamptz,
  add column if not exists provider_payload    jsonb;        -- raw provider response (debug)

create index if not exists payment_requests_provider_idx
  on public.payment_requests (provider, status);

create index if not exists payment_requests_provider_session_idx
  on public.payment_requests (provider, provider_session_id)
  where provider_session_id is not null;

-- Helpful RPC to mark an in-flight QR payment as approved when the gateway
-- webhook (or a polled status check) confirms it. Same trigger fires.
create or replace function public.confirm_payment_request(
  p_request_id   uuid,
  p_provider     public.payment_provider,
  p_provider_ref text,
  p_payload      jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.payment_requests
     set status               = 'approved',
         reviewed_at          = coalesce(reviewed_at, now()),
         provider_session_id  = coalesce(provider_session_id, p_provider_ref),
         provider_payload     = coalesce(p_payload, provider_payload)
   where id = p_request_id
     and provider = p_provider
     and status in ('draft','pending');
end;
$$;
