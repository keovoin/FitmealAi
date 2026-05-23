"use server";

import { generateMealPlan } from "@/lib/ai/meal-plan-service";
import { isAIConfigured } from "@/lib/ai/openai";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";
import { setAbaPaymentSettings, type AbaPaymentSettings } from "./app-settings";
import {
  setNotificationTemplates,
  type NotificationTemplates,
} from "./notification-templates";

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

/**
 * Admin support tool: regenerate today's AI meal plan for a user using
 * their saved Supabase onboarding preferences.
 */
export async function regenerateUserMealPlan(userId: string) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Supabase is not configured." };
  }

  if (!isAIConfigured()) {
    return { ok: false as const, error: "OPENAI_API_KEY is not configured." };
  }

  const cleanUserId = userId.trim();
  if (!cleanUserId) {
    return { ok: false as const, error: "User ID is required." };
  }

  const sb = getSupabaseAdmin();
  const [{ data: goal }, { data: mealPrefs }] = await Promise.all([
    sb
      .from("user_goals")
      .select("fitness_goal,daily_calorie_target")
      .eq("user_id", cleanUserId)
      .maybeSingle(),
    sb
      .from("meal_prefs")
      .select("diets,timings,cook_time,allergies")
      .eq("user_id", cleanUserId)
      .maybeSingle(),
  ]);

  const result = await generateMealPlan({
    user_id: cleanUserId,
    goal: normalizeGoal(goal?.fitness_goal),
    daily_calorie_target: Number(goal?.daily_calorie_target ?? 2000),
    diets: normalizeStringArray(mealPrefs?.diets, ["balanced"]),
    allergies: normalizeStringArray(mealPrefs?.allergies, []),
    cook_time: typeof mealPrefs?.cook_time === "string" ? mealPrefs.cook_time : "30 min",
    meal_types: mealTypesFromTimings(normalizeStringArray(mealPrefs?.timings, ["breakfast", "lunch", "dinner"])),
    date: todayString(),
    reuse_today_if_present: false,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.reason };
  }

  revalidatePath(`/users/${cleanUserId}`);
  revalidatePath("/");
  return {
    ok: true as const,
    planId: result.plan_id,
    mealCount: result.meals.length,
    reused: result.reused,
  };
}

type GoalValue = "lose_weight" | "build_muscle" | "stay_fit" | "eat_healthier";
type MealTypeValue = "breakfast" | "lunch" | "dinner" | "snack";

function normalizeGoal(value: unknown): GoalValue {
  if (
    value === "lose_weight" ||
    value === "build_muscle" ||
    value === "stay_fit" ||
    value === "eat_healthier"
  ) {
    return value;
  }
  return "eat_healthier";
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : fallback;
}

function mealTypesFromTimings(timings: string[]): MealTypeValue[] {
  const mapped = timings.map((timing): MealTypeValue => {
    if (timing === "breakfast") return "breakfast";
    if (timing === "lunch") return "lunch";
    if (timing === "dinner") return "dinner";
    return "snack";
  });
  return [...new Set(mapped)].sort((a, b) => mealTypeOrder(a) - mealTypeOrder(b));
}

function mealTypeOrder(value: MealTypeValue): number {
  return value === "breakfast" ? 0 : value === "lunch" ? 1 : value === "dinner" ? 2 : 3;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Persist the ABA payment toggle + allowed-regions list. The change is
 * effective immediately for every mobile client because /api/payments/options
 * never caches the row.
 */
export async function updateAbaPaymentSettings(
  next: AbaPaymentSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    await setAbaPaymentSettings(next);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  revalidatePath("/payment-settings");
  revalidatePath("/settings");
  revalidatePath("/setup");
  return { ok: true };
}



/**
 * Persist edited notification templates. Effective immediately for any
 * server-side render of /api/push/send and /api/telegram/send because
 * those routes load the row on each call.
 */
export async function updateNotificationTemplates(
  next: NotificationTemplates,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    await setNotificationTemplates(next);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  revalidatePath("/notifications");
  return { ok: true };
}

/**
 * Admin override: flip a referral's status. The DB trigger on `referrals`
 * fires only when status transitions into 'verified' from something else,
 * so manually verifying here also kicks off the auto-Gold reward at 3.
 */
export async function setReferralStatus(
  referralId: string,
  next: "verified" | "rejected",
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const sb = getSupabaseAdmin();
  const update: Record<string, unknown> = { status: next };
  if (next === "verified") {
    update.verified_at = new Date().toISOString();
  }
  const { error } = await sb
    .from("referrals")
    .update(update)
    .eq("id", referralId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/referrals");
  return { ok: true };
}
