import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/factory";
import type { PaymentProviderId, PaymentSessionStatus } from "@/lib/payments/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/payments/status/[id]
 *
 * Mobile clients poll this every ~3s until `status` is one of
 * "approved" | "expired" | "rejected".
 *
 * The endpoint short-circuits on already-approved DB rows so we don't
 * hammer the gateway unnecessarily, then otherwise calls
 * provider.checkStatus() and updates the DB if the provider says paid.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const { data: row, error } = await sb
    .from("payment_requests")
    .select("id,status,provider,provider_session_id,expires_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Already terminal in DB? Return it as-is.
  if (row.status === "approved" || row.status === "rejected") {
    return NextResponse.json({
      paymentRequestId: row.id,
      status: row.status as PaymentSessionStatus,
      providerId: row.provider as PaymentProviderId,
    });
  }

  // Expired but still pending? Mark it.
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await sb
      .from("payment_requests")
      .update({ status: "rejected", reviewer_note: "expired" })
      .eq("id", row.id);
    return NextResponse.json({
      paymentRequestId: row.id,
      status: "expired" as PaymentSessionStatus,
      providerId: row.provider as PaymentProviderId,
    });
  }

  if (!row.provider_session_id || row.provider === "manual_aba") {
    return NextResponse.json({
      paymentRequestId: row.id,
      status: "pending" as PaymentSessionStatus,
      providerId: row.provider as PaymentProviderId,
    });
  }

  let liveStatus: PaymentSessionStatus = "pending";
  let providerReference: string | undefined;
  let rawResponse: unknown;
  try {
    const providerImpl = getPaymentProvider(row.provider as PaymentProviderId);
    const result = await providerImpl.checkStatus(row.provider_session_id);
    liveStatus = result.status;
    providerReference = result.providerReference;
    rawResponse = result.rawResponse;
  } catch (e) {
    return NextResponse.json({
      paymentRequestId: row.id,
      status: "pending" as PaymentSessionStatus,
      providerId: row.provider as PaymentProviderId,
      message: (e as Error).message,
    });
  }

  // Note: the DB trigger payment_requests_approval on UPDATE upgrades the
  // user's tier and inserts an active subscription on status='approved'.
  if (liveStatus === "approved") {
    await sb.rpc("confirm_payment_request", {
      p_request_id: row.id,
      p_provider: row.provider,
      p_provider_ref: providerReference ?? row.provider_session_id,
      p_payload: (rawResponse as object) ?? {},
    });
  } else {
    await sb
      .from("payment_requests")
      .update({ last_polled_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  return NextResponse.json({
    paymentRequestId: row.id,
    status: liveStatus,
    providerId: row.provider as PaymentProviderId,
    providerReference,
  });
}
