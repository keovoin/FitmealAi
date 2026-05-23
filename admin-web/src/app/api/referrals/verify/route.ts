import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  referred_user_id: z.string().min(1),
});

/**
 * POST /api/referrals/verify
 * Called after the referred user completes a qualifying action
 * (onboarding complete OR first AI meal generation). This flips the
 * referral status from 'pending' to 'verified', which triggers the
 * DB trigger to check if the referrer has hit 3 and auto-reward Gold.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { referred_user_id } = parsed.data;
  const sb = getSupabaseAdmin();

  const { data, error } = await sb
    .from("referrals")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("referred_id", referred_user_id)
    .eq("status", "pending")
    .select("referrer_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: true, note: "no_pending_referral" });
  }

  return NextResponse.json({ ok: true, referrer_id: data.referrer_id });
}
