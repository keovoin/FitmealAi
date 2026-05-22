import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/factory";
import type { PaymentProviderId } from "@/lib/payments/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhooks/[provider]
 *
 * Receives async confirmation callbacks from the gateway. The provider
 * implementation is responsible for verifying the signature/HMAC. If the
 * signature is invalid we return 401 and do not touch the DB — this
 * stops a forged "payment approved" from upgrading anyone's tier.
 *
 * Configure each provider's dashboard with the matching URL:
 *   - https://your-app.vercel.app/api/payments/webhooks/aba_payway
 *   - https://your-app.vercel.app/api/payments/webhooks/camrapidpay
 *   - https://your-app.vercel.app/api/payments/webhooks/bakong_khqr   (internal cron)
 */

const ALLOWED: PaymentProviderId[] = ["bakong_khqr", "aba_payway", "camrapidpay"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const { provider } = await params;
  if (!ALLOWED.includes(provider as PaymentProviderId)) {
    return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  }

  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let providerImpl;
  try {
    providerImpl = getPaymentProvider(provider as PaymentProviderId);
  } catch {
    return NextResponse.json({ error: "provider_unavailable" }, { status: 503 });
  }

  const verified = await providerImpl.verifyWebhook(rawBody, headers);
  if (!verified) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  const { data: row, error } = await sb
    .from("payment_requests")
    .select("id,status,provider")
    .eq("provider", providerImpl.id)
    .eq("provider_session_id", verified.providerSessionId)
    .maybeSingle();
  if (error || !row) {
    // We accept the webhook but do nothing — provider may retry.
    return NextResponse.json({ ok: true, acknowledged: false });
  }

  if (verified.status === "approved" && row.status !== "approved") {
    await sb.rpc("confirm_payment_request", {
      p_request_id: row.id,
      p_provider: providerImpl.id,
      p_provider_ref: verified.providerSessionId,
      p_payload: (verified.raw as object) ?? {},
    });
  } else if (verified.status === "expired" || verified.status === "rejected") {
    await sb
      .from("payment_requests")
      .update({
        status: "rejected",
        reviewer_note: `webhook_${verified.status}`,
        provider_payload: (verified.raw as object) ?? {},
      })
      .eq("id", row.id);
  } else {
    await sb
      .from("payment_requests")
      .update({ last_polled_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  return NextResponse.json({ ok: true, acknowledged: true });
}
