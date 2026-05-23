import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getQuotaSettings,
  getUserDailyUsage,
} from "@/lib/supabase/quota-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/quotas?user_id=...
 *
 * Returns today's used/limit pair for both AI generations and catalog
 * shuffles, computed from the user's tier + the admin-tunable
 * `quotas.*` rows in `app_settings`. Mobile clients show
 * "8 / 10 left" UI from this.
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const [{ data: profile }, settings, usage] = await Promise.all([
    sb.from("profiles").select("tier").eq("id", userId).maybeSingle(),
    getQuotaSettings(),
    getUserDailyUsage(userId),
  ]);

  const tier: "free" | "silver" | "gold" =
    profile?.tier === "silver" || profile?.tier === "gold" ? profile.tier : "free";

  const tierSettings =
    tier === "gold" ? settings.gold : tier === "silver" ? settings.silver : settings.free;

  return NextResponse.json(
    {
      tier,
      ai: {
        used: usage.aiUsed,
        limit: tierSettings.aiPerDay,
        unlimited: tierSettings.aiPerDay < 0,
      },
      shuffles: {
        used: usage.shufflesUsed,
        limit: tierSettings.shufflesPerDay,
        unlimited: tierSettings.shufflesPerDay < 0,
      },
      shuffle_meal_count: settings.shuffleMealCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
