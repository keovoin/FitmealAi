import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/factory";
import { PLAN_PRICES } from "@/lib/payments/types";
import type { PaymentProviderId } from "@/lib/payments/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create-khqr
 *
 * Body: { user_id, tier: 'Silver'|'Gold', provider?: PaymentProviderId }
 *
 * Returns: { paymentRequestId, qrPayload, qrImageUrl?, expiresAt, deepLink?,
 *            providerSessionId, providerId, status }
 *
 * The mobile clients call this to start a KHQR payment. The DB row in
 * payment_requests starts as `pending`, and gets promoted to `approved`
 * once the matching webhook (or status-poll) confirms the transaction.
 */

const Body = z.object({
  user_id: z.string().min(1),
  tier: z.enum(["Silver", "Gold"]),
  provider: z
    .enum(["bakong_khqr", "aba_payway", "camrapidpay"])
    .optional(),
  description: z.string().max(140).optional(),
});

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { user_id, tier, provider, description } = parsed.data;
  const price = PLAN_PRICES[tier];

  let providerImpl;
  try {
    providerImpl = getPaymentProvider(provider);
  } catch (e) {
    return NextResponse.json(
      { error: "provider_unavailable", message: (e as Error).message },
      { status: 503 },
    );
  }

  if (!providerImpl.isConfigured()) {
    return NextResponse.json(
      {
        error: "provider_not_configured",
        provider: providerImpl.id,
        message: `Provider ${providerImpl.id} requires additional env vars.`,
      },
      { status: 503 },
    );
  }

  // Step 1: insert a pending payment_requests row first so we have an id.
  const sb = getSupabaseAdmin();
  const { data: insertData, error: insertError } = await sb
    .from("payment_requests")
    .insert({
      user_id,
      tier: tier.toLowerCase(),                    // payment_requests.tier is enum lowercase
      amount: price.display,
      transaction_id: "(pending)",                 // updated once provider responds
      status: "pending",
      provider: providerImpl.id,
      currency: "USD",
      amount_minor: Math.round(price.amountUsd * 100),
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insertError || !insertData) {
    return NextResponse.json(
      { error: "insert_failed", message: insertError?.message },
      { status: 500 },
    );
  }

  // Step 2: ask the provider to create a session.
  let session;
  try {
    session = await providerImpl.createSession({
      userId: user_id,
      tier,
      amountUsd: price.amountUsd,
      description: description ?? `FitMeal ${tier} (1 month)`,
      reference: insertData.id,
    });
  } catch (e) {
    // Mark the request as rejected so we don't leave dangling pending rows.
    await sb
      .from("payment_requests")
      .update({ status: "rejected", reviewer_note: `provider_error: ${(e as Error).message}` })
      .eq("id", insertData.id);
    return NextResponse.json(
      { error: "provider_create_failed", message: (e as Error).message },
      { status: 502 },
    );
  }

  // Step 3: persist the QR payload + provider session id.
  await sb
    .from("payment_requests")
    .update({
      provider_session_id: session.providerSessionId,
      transaction_id: session.providerSessionId,
      qr_payload: session.qrPayload,
      qr_image_url: session.qrImageUrl ?? null,
      md5_hash: providerImpl.id === "bakong_khqr" ? session.providerSessionId : null,
      expires_at: session.expiresAt,
      provider_payload: session.rawResponse as object,
    })
    .eq("id", insertData.id);

  return NextResponse.json({
    paymentRequestId: insertData.id,
    providerId: providerImpl.id as PaymentProviderId,
    providerSessionId: session.providerSessionId,
    qrPayload: session.qrPayload ?? null,
    qrImageUrl: session.qrImageUrl ?? null,
    deepLink: session.deepLink ?? null,
    checkoutUrl: session.checkoutUrl ?? null,
    expiresAt: session.expiresAt,
    status: "pending",
  });
}
