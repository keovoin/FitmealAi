import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/referrals?user_id=...
 * Returns the user's referral code + stats (count, reward status).
 *
 * POST /api/referrals
 * Called when a new user signs up with a referral code.
 * Body: { referral_code, referred_user_id, device_fingerprint }
 * Validates:
 *   - Code exists and belongs to a different user
 *   - device_fingerprint hasn't been used by the referrer before (anti-abuse)
 *   - referred_user is not the same as referrer
 */

const ApplyBody = z.object({
  referral_code: z.string().min(4).max(20),
  referred_user_id: z.string().min(1),
  device_fingerprint: z.string().min(8).max(256),
});

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  // Get or create referral code
  let { data: codeRow } = await sb
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();

  if (!codeRow) {
    // Generate a unique 8-char code
    const code = `FM${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const { data: inserted } = await sb
      .from("referral_codes")
      .insert({ user_id: userId, code })
      .select("code")
      .single();
    codeRow = inserted;
  }

  // Count referrals
  const { count: verifiedCount } = await sb
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .in("status", ["verified", "rewarded"]);

  const { count: pendingCount } = await sb
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .eq("status", "pending");

  return NextResponse.json({
    code: codeRow?.code ?? null,
    verified: verifiedCount ?? 0,
    pending: pendingCount ?? 0,
    target: 3,
    rewarded: (verifiedCount ?? 0) >= 3,
  });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const parsed = ApplyBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { referral_code, referred_user_id, device_fingerprint } = parsed.data;
  const sb = getSupabaseAdmin();

  // Look up the code
  const { data: codeRow } = await sb
    .from("referral_codes")
    .select("user_id")
    .eq("code", referral_code.toUpperCase())
    .maybeSingle();

  if (!codeRow) {
    return NextResponse.json({ error: "invalid_code" }, { status: 404 });
  }

  const referrerId = codeRow.user_id;

  // Anti-abuse: can't refer yourself
  if (referrerId === referred_user_id) {
    return NextResponse.json({ error: "self_referral" }, { status: 400 });
  }

  // Anti-abuse: same device fingerprint check
  const { data: existingDevice } = await sb
    .from("referrals")
    .select("id")
    .eq("referrer_id", referrerId)
    .eq("device_fingerprint", device_fingerprint)
    .maybeSingle();

  if (existingDevice) {
    return NextResponse.json({ error: "same_device_detected", message: "This device has already been used for a referral from this user." }, { status: 409 });
  }

  // Anti-abuse: referred user already referred by someone
  const { data: alreadyReferred } = await sb
    .from("referrals")
    .select("id")
    .eq("referred_id", referred_user_id)
    .maybeSingle();

  if (alreadyReferred) {
    return NextResponse.json({ error: "already_referred" }, { status: 409 });
  }

  // Insert referral as pending (will be verified after the referred user
  // completes onboarding or makes their first AI generation)
  const { error } = await sb
    .from("referrals")
    .insert({
      referrer_id: referrerId,
      referred_id: referred_user_id,
      device_fingerprint,
      status: "pending",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
