import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateBody = z.object({
  user_id: z.string().min(1),
  meal_plan_ready: z.boolean().optional(),
  payment_approved: z.boolean().optional(),
  water_reminder: z.boolean().optional(),
  workout_reminder: z.boolean().optional(),
  habit_streak: z.boolean().optional(),
  weekly_summary: z.boolean().optional(),
});

/**
 * GET /api/notifications/prefs?user_id=...
 * Returns the user's notification preferences.
 *
 * PUT /api/notifications/prefs
 * Updates notification preferences. Only includes changed fields.
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
  const { data } = await sb
    .from("notification_prefs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // Return defaults if no row exists yet
  const prefs = data ?? {
    meal_plan_ready: true,
    payment_approved: true,
    water_reminder: true,
    workout_reminder: true,
    habit_streak: true,
    weekly_summary: true,
    telegram_linked: false,
  };

  return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const parsed = UpdateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { user_id, ...fields } = parsed.data;
  const sb = getSupabaseAdmin();

  const { error } = await sb
    .from("notification_prefs")
    .upsert(
      { user_id, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
