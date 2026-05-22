import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/payments/qr/[id]
 *
 * Renders the QR payload stored for a payment request as a PNG. The
 * mobile clients can either decode `qrPayload` themselves or just
 * <Image source="…/api/payments/qr/{id}.png" />.
 *
 * Cache-Control is set to no-store because once the QR expires, returning
 * a stale image would mislead the user into trying to pay something dead.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const { id } = await params;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("payment_requests")
    .select("qr_payload,expires_at,status,qr_image_url")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // If the gateway hosts the QR for us, redirect to that URL.
  if (data.qr_image_url) {
    return NextResponse.redirect(data.qr_image_url, 307);
  }
  if (!data.qr_payload) {
    return NextResponse.json({ error: "no_payload" }, { status: 404 });
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  // High error correction so the QR survives camera shake on a phone.
  const png = await QRCode.toBuffer(data.qr_payload, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
  });

  return new NextResponse(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Length": String(png.byteLength),
    },
  });
}
