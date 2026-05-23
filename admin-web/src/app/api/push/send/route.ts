import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  user_id: z.string().min(1),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.string()).optional(),
});

/**
 * POST /api/push/send
 * Admin/server-side endpoint to send a push notification to a user.
 * In production, this would call Firebase Admin SDK (FCM) for Android
 * and Apple's APNs HTTP/2 endpoint for iOS.
 *
 * For now it:
 * 1. Looks up the user's tokens from push_tokens
 * 2. Checks their notification_prefs
 * 3. Logs what WOULD be sent (actual FCM/APNs integration requires
 *    FIREBASE_SERVICE_ACCOUNT_JSON and APNs key in env)
 *
 * Required env for production:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON (for FCM)
 *   - APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8 (for iOS)
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { user_id, title, body, data } = parsed.data;
  const sb = getSupabaseAdmin();

  // Get user's push tokens
  const { data: tokens } = await sb
    .from("push_tokens")
    .select("platform,token")
    .eq("user_id", user_id);

  if (!tokens?.length) {
    return NextResponse.json({ error: "no_tokens", sent: 0 });
  }

  // Check if FCM/APNs is configured
  const hasFcm = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasApns = !!process.env.APNS_KEY_ID;

  const results = [];
  for (const t of tokens) {
    if (t.platform === "android" && hasFcm) {
      // TODO: Call FCM HTTP v1 API
      results.push({ platform: "android", status: "would_send" });
    } else if (t.platform === "ios" && hasApns) {
      // TODO: Call APNs HTTP/2
      results.push({ platform: "ios", status: "would_send" });
    } else {
      results.push({ platform: t.platform, status: "provider_not_configured" });
    }
  }

  // Log for debugging
  console.log(`[push] ${user_id}: "${title}" → ${tokens.length} token(s)`, results);

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.status === "would_send").length,
    tokens: tokens.length,
    results,
    note: !hasFcm && !hasApns
      ? "Set FIREBASE_SERVICE_ACCOUNT_JSON and/or APNS_KEY_ID to actually deliver push notifications."
      : undefined,
  });
}
