"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "./server";

/**
 * Mark a pending payment as approved or rejected. The DB trigger
 * `on_payment_approved` will:
 *   - Bump the user's profile.tier
 *   - Insert an active subscription if one doesn't already exist
 *
 * Re-approving the same payment is a no-op (the trigger checks
 * `old.status is distinct from 'approved'`).
 */
export async function reviewPayment(
  paymentId: string,
  decision: "approve" | "reject",
  reviewerNote: string,
) {
  const sb = getSupabaseAdmin();

  const update = {
    status: decision === "approve" ? "approved" : "rejected",
    reviewed_at: new Date().toISOString(),
    reviewer_note: reviewerNote.trim() || null,
  };

  const { error } = await sb
    .from("payment_requests")
    .update(update)
    .eq("id", paymentId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  // Re-render the payment list and the detail page so the new status shows.
  revalidatePath("/payments");
  revalidatePath(`/payments/${paymentId}`);
  revalidatePath("/");
  return { ok: true as const };
}

/**
 * Suspend or reactivate a user. Admin override only.
 */
export async function setUserStatus(
  userId: string,
  status: "active" | "suspended",
) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  return { ok: true as const };
}

/**
 * Comp Gold: give the user a 30-day free Gold subscription. Used as an
 * admin courtesy. Idempotent within a 30-day window.
 */
export async function compGold(userId: string) {
  const sb = getSupabaseAdmin();

  const { error: profileErr } = await sb
    .from("profiles")
    .update({ tier: "gold", updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (profileErr) return { ok: false as const, error: profileErr.message };

  const startedAt = new Date();
  const renewsAt = new Date(startedAt);
  renewsAt.setDate(renewsAt.getDate() + 30);

  // Skip if user already has an active gold sub
  const { data: existing } = await sb
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("tier", "gold")
    .eq("status", "active")
    .maybeSingle();
  if (existing) {
    revalidatePath(`/users/${userId}`);
    return { ok: true as const, already: true as const };
  }

  const { error: subErr } = await sb.from("subscriptions").insert({
    user_id: userId,
    tier: "gold",
    source: "aba_manual",
    status: "active",
    monthly_price: "$0.00",
    started_at: startedAt.toISOString(),
    renews_at: renewsAt.toISOString(),
  });
  if (subErr) return { ok: false as const, error: subErr.message };

  revalidatePath(`/users/${userId}`);
  revalidatePath("/subscriptions");
  return { ok: true as const };
}
