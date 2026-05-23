import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getQuotaSettings,
  getUserDailyUsage,
} from "@/lib/supabase/quota-settings";
import { shuffleForUser } from "@/lib/supabase/recipes-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Query = z.object({
  user_id: z.string().min(1),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  /** Optional override; defaults to admin-configured `quotas.shuffle_meal_count`. */
  count: z.coerce.number().int().min(1).max(10).optional(),
});

/**
 * GET /api/recipes/shuffle?user_id=...&meal_type=lunch&count=1
 *
 * Returns N random `published` recipes filtered by the user's diet,
 * allergen, and cook-time prefs. Decrements the user's daily shuffle
 * counter via `bump_quota`. Returns 429 + `upgrade_prompt: true` when
 * the user hits their cap.
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { user_id, meal_type } = parsed.data;
  const sb = getSupabaseAdmin();

  // 1. Resolve tier + caps.
  const [{ data: profile }, settings] = await Promise.all([
    sb.from("profiles").select("tier").eq("id", user_id).maybeSingle(),
    getQuotaSettings(),
  ]);
  const tier: "free" | "silver" | "gold" =
    profile?.tier === "silver" || profile?.tier === "gold" ? profile.tier : "free";
  const tierSettings =
    tier === "gold" ? settings.gold : tier === "silver" ? settings.silver : settings.free;
  const cap = tierSettings.shufflesPerDay;
  const isUnlimited = cap < 0;

  // 2. Cap check (skip when unlimited).
  if (!isUnlimited) {
    const usage = await getUserDailyUsage(user_id);
    if (usage.shufflesUsed >= cap) {
      return NextResponse.json(
        {
          error: "daily_cap_reached",
          upgrade_prompt: true,
          shuffles: { used: usage.shufflesUsed, limit: cap },
        },
        { status: 429 },
      );
    }
  }

  // 3. Catalog readiness check. If too few published recipes for this
  //    meal_type exist, hide the feature so users don't shuffle through
  //    the same 2 items repeatedly.
  const { count: publishedCount } = await sb
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("meal_type", meal_type);
  if ((publishedCount ?? 0) < settings.catalogMinPublishedPerMealType) {
    return NextResponse.json(
      {
        error: "catalog_not_ready",
        published_count: publishedCount ?? 0,
        required: settings.catalogMinPublishedPerMealType,
      },
      { status: 503 },
    );
  }

  // 4. Resolve user prefs (diets / allergens / cook time).
  const { data: prefs } = await sb
    .from("meal_prefs")
    .select("diets,allergies,cook_time")
    .eq("user_id", user_id)
    .maybeSingle();

  const diets = Array.isArray(prefs?.diets) ? (prefs.diets as string[]) : [];
  const allergens = Array.isArray(prefs?.allergies) ? (prefs.allergies as string[]) : [];
  const cookTimeMinutes =
    typeof prefs?.cook_time === "string" ? parseCookTimeMinutes(prefs.cook_time) : null;

  // 5. Pull candidates and shuffle in-memory.
  const recipes = await shuffleForUser({
    userId: user_id,
    mealType: meal_type,
    diets,
    allergens,
    cookTimeMinutes,
    count: parsed.data.count ?? settings.shuffleMealCount,
  });

  if (recipes.length === 0) {
    return NextResponse.json(
      {
        error: "no_match",
        hint: "No published recipes match the user's diet/allergens/cook-time.",
      },
      { status: 404 },
    );
  }

  // 6. Bump counter (idempotent on the same call thanks to atomic upsert).
  let used = 0;
  if (!isUnlimited) {
    const { data: bumped } = await sb.rpc("bump_quota", {
      p_user_id: user_id,
      p_kind: "shuffle",
    });
    const row = (bumped as Array<{ used: number; cap: number }>)?.[0];
    used = row?.used ?? 0;
  }

  return NextResponse.json(
    {
      recipes,
      shuffles: {
        used,
        limit: cap,
        unlimited: isUnlimited,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Parse "30 min" / "60 min" / "15-30 min" into a single integer cap. */
function parseCookTimeMinutes(raw: string): number | null {
  const m = raw.match(/(\d+)/g);
  if (!m || m.length === 0) return null;
  // Use the LAST number so "15-30 min" → 30 (the upper bound).
  const last = m[m.length - 1];
  const n = Number(last);
  return Number.isFinite(n) && n > 0 ? n : null;
}
