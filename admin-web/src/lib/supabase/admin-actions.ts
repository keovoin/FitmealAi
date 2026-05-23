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



// ===========================================================================
// Phase 5: quota settings, pricing offers, recipes catalog
// ===========================================================================

import {
  setQuotaSettings,
  type QuotaSettings,
} from "./quota-settings";
import {
  setPricingOffers,
  type PricingOffers,
} from "./pricing-offers";
import {
  setRecipeStatus,
  updateRecipe,
  upsertRecipe,
  type RecipeWriteInput,
  type RecipeStatus,
} from "./recipes-queries";
import {
  generateRecipeForAdmin,
  type GenerateRecipeOptions,
  type GenerateRecipeResult,
} from "@/lib/ai/recipe-generator";
import { parseBulkRecipesJson } from "@/lib/recipes/bulk-import";
import {
  StorageUploadError,
  uploadRecipeImage,
} from "./storage";

/**
 * Persist the per-tier daily quotas (Free/Silver/Gold AI + shuffles).
 * `check_ai_rate_limit()` reads these on every AI call, so the change
 * is effective immediately for every mobile client.
 */
export async function updateQuotaSettings(
  next: QuotaSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    await setQuotaSettings(next);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  revalidatePath("/quotas");
  revalidatePath("/setup");
  return { ok: true };
}

/**
 * Persist the trial + first-payment-discount config for both paid
 * tiers. Mobile clients pick up the new offer text on their next
 * /api/payments/options poll (typically when the paywall opens).
 */
export async function updatePricingOffers(
  next: PricingOffers,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    await setPricingOffers(next);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  revalidatePath("/payment-settings");
  return { ok: true };
}

/** Create a new recipe (admin-side; defaults to draft). */
export async function createRecipe(
  input: RecipeWriteInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    const recipe = await upsertRecipe(input);
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipe.id}`);
    return { ok: true, id: recipe.id };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/** Edit an existing recipe in place. */
export async function saveRecipe(
  id: string,
  patch: Partial<RecipeWriteInput>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    await updateRecipe(id, patch);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { ok: true };
}

/**
 * Flip a recipe's status. `published` records `approved_at` so we know
 * when it became visible to mobile clients. Used by the per-row
 * Publish / Archive / Restore buttons.
 */
export async function transitionRecipe(
  id: string,
  next: RecipeStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    await setRecipeStatus(id, next);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { ok: true };
}

// ===========================================================================
// Phase 5b: image upload, bulk import, AI generate
// ===========================================================================

/**
 * Receive a file from the recipe form's image picker, upload it to
 * the public `recipe-images` bucket, and return the CDN URL the form
 * should persist into `recipes.image_url`.
 *
 * Server actions accept binary payloads via `FormData`, which sidesteps
 * the 4.5 MB body limit on traditional Vercel API routes. We still cap
 * uploads at 8 MB inside `uploadRecipeImage` to be polite.
 */
export async function uploadRecipeImageAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const file = formData.get("file");
  const slug = (formData.get("slug") as string | null) ?? undefined;

  if (!(file instanceof Blob)) {
    return { ok: false, error: "No file provided." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";
    const uploaded = await uploadRecipeImage({ buffer, contentType, slug });
    return { ok: true, url: uploaded.url };
  } catch (error) {
    if (error instanceof StorageUploadError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: (error as Error).message ?? "Upload failed.",
    };
  }
}

/**
 * Bulk-insert N draft recipes from a parsed JSON file. Each row is
 * inserted independently so a single broken row doesn't sink the
 * batch — the response separates successes from failures so the UI
 * can render a per-row table.
 */
export async function bulkUploadRecipesAction(input: {
  payload: string;
}): Promise<{
  ok: true;
  total: number;
  inserted: number;
  failed: { index: number; error: string }[];
  fileErrors: string[];
} | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const report = parseBulkRecipesJson(input.payload);
  if (report.fileErrors.length > 0 && report.validRows.length === 0) {
    return {
      ok: true,
      total: report.total,
      inserted: 0,
      failed: report.invalidRows.map((r) => ({
        index: r.index,
        error: r.error,
      })),
      fileErrors: report.fileErrors,
    };
  }

  const failed: { index: number; error: string }[] = [
    ...report.invalidRows.map((r) => ({ index: r.index, error: r.error })),
  ];
  let inserted = 0;

  // Insert sequentially so we don't hammer the connection pool — the
  // expected batch size is small (< 200) and DB writes are quick.
  for (const row of report.validRows) {
    try {
      await upsertRecipe(row.recipe);
      inserted += 1;
    } catch (error) {
      failed.push({
        index: row.index,
        error: (error as Error).message ?? "Unknown DB error",
      });
    }
  }

  if (inserted > 0) {
    revalidatePath("/recipes");
  }

  return {
    ok: true,
    total: report.total,
    inserted,
    failed,
    fileErrors: report.fileErrors,
  };
}

/**
 * One-shot AI recipe generator for the admin dashboard. Returns the
 * generated recipe + image URL (if requested) so the form can pre-fill
 * — does NOT persist. The admin reviews and clicks "Create draft" the
 * usual way.
 */
export async function aiGenerateRecipeAction(
  options: Omit<GenerateRecipeOptions, "adminUserId">,
): Promise<
  | { ok: true; result: GenerateRecipeResult }
  | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const outcome = await generateRecipeForAdmin(options);
  if (!outcome.ok) {
    return { ok: false, error: outcome.error };
  }
  return { ok: true, result: outcome.result };
}
