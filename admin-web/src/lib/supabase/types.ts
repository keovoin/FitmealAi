/**
 * Lightweight DB row types matching the Supabase schema in
 * supabase/migrations/. We keep these by hand for now; once we wire
 * `supabase gen types` we'll replace this with the generated file.
 */

export type SubscriptionTierDb = "free" | "silver" | "gold";
export type UserStatusDb       = "active" | "suspended" | "deleted";
export type PaymentStatusDb    = "draft" | "pending" | "approved" | "rejected";
export type PaymentSourceDb    = "storekit" | "aba_manual";
export type SubscriptionStatusDb = "active" | "canceled" | "past_due";

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  country: string | null;
  tier: SubscriptionTierDb;
  status: UserStatusDb;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

export interface PaymentRequestRow {
  id: string;
  user_id: string;
  tier: SubscriptionTierDb;
  amount: string;
  transaction_id: string;
  receipt_storage_path: string | null;
  status: PaymentStatusDb;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_id: string | null;
  reviewer_note: string | null;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  tier: SubscriptionTierDb;
  source: PaymentSourceDb;
  status: SubscriptionStatusDb;
  monthly_price: string;
  started_at: string;
  renews_at: string | null;
  canceled_at: string | null;
}
