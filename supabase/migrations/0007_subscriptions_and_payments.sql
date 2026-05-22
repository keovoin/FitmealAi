-- =============================================================================
-- 0007_subscriptions_and_payments.sql
-- subscriptions: source of truth for paid access.
-- payment_requests: ABA manual receipts the admin reviews.
-- A trigger upgrades the user's profile.tier when a payment is approved.
-- =============================================================================

create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  tier            subscription_tier   not null,
  source          payment_source      not null,
  status          subscription_status not null default 'active',
  monthly_price   text                not null,         -- display string, e.g. '$9.99'
  started_at      timestamptz         not null default now(),
  renews_at       timestamptz,
  canceled_at     timestamptz
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

create table if not exists public.payment_requests (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  tier                  subscription_tier not null,
  amount                text not null,                  -- '$9.99'
  transaction_id        text not null,
  receipt_storage_path  text,                           -- key in 'receipts' bucket
  status                payment_status not null default 'draft',
  submitted_at          timestamptz,
  reviewed_at           timestamptz,
  reviewer_id           uuid references auth.users(id),
  reviewer_note         text,
  created_at            timestamptz not null default now()
);

create index if not exists payment_requests_status_idx on public.payment_requests (status);
create index if not exists payment_requests_user_idx   on public.payment_requests (user_id);

-- When a payment is approved, also bump the user's tier and create an
-- active subscription row. Idempotent: re-approving the same row is a no-op.
create or replace function public.on_payment_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  monthly text;
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    -- Bump the user's tier to whatever they paid for
    update public.profiles
       set tier = new.tier,
           updated_at = now()
     where id = new.user_id;

    monthly := case new.tier
      when 'silver' then '$4.99'
      when 'gold'   then '$9.99'
      else '$0'
    end;

    -- Create an active subscription if one doesn't exist for this tier
    insert into public.subscriptions (user_id, tier, source, status, monthly_price, started_at, renews_at)
    select new.user_id, new.tier, 'aba_manual'::payment_source, 'active'::subscription_status,
           monthly, now(), now() + interval '30 days'
    where not exists (
      select 1 from public.subscriptions
       where user_id = new.user_id and tier = new.tier and status = 'active'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists payment_requests_approval on public.payment_requests;
create trigger payment_requests_approval
  after update on public.payment_requests
  for each row execute function public.on_payment_approved();
