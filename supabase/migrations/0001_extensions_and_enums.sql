-- =============================================================================
-- 0001_extensions_and_enums.sql
-- Required extensions and shared enum types.
-- Apply in order; each migration is idempotent so re-runs are safe.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type subscription_tier as enum ('free', 'silver', 'gold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('active', 'suspended', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fitness_goal as enum ('lose_weight', 'build_muscle', 'stay_fit', 'eat_healthier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('draft', 'pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_source as enum ('storekit', 'aba_manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'canceled', 'past_due');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ai_generation_kind as enum ('meal_plan', 'workout_plan', 'meal_image');
exception when duplicate_object then null; end $$;
