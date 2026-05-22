import "server-only";
import crypto from "crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentSessionStatus,
  PaymentStatusResult,
} from "./types";

/**
 * CamRapidPay provider.
 *
 * Managed Bakong KHQR gateway with JSON REST + webhook callbacks. Easier
 * to plug in than direct Bakong, and good when you don't want to manage
 * the Bakong developer token yourself or need failover across many
 * Cambodian banks.
 *
 * Required env (Vercel):
 *   - CAMRAPIDPAY_API_KEY
 *   - CAMRAPIDPAY_BASE_URL          e.g. https://api.camrapidpay.com
 *   - CAMRAPIDPAY_WEBHOOK_SECRET    used to verify the X-Signature header
 *
 * Reference: https://docs.camrapidpay.com/
 *
 * Notes: the exact request shape is small (api_key, amount, currency,
 *        reference, description). The provider returns `qr_data` (KHQR
 *        EMVCo string), `qr_image_url` (PNG), and `transaction_id`.
 *        Webhook signs the raw body with HMAC-SHA256.
 */
export class CamRapidPayProvider implements PaymentProvider {
  readonly id = "camrapidpay" as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.CAMRAPIDPAY_API_KEY && process.env.CAMRAPIDPAY_BASE_URL,
    );
  }

  async createSession(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) {
      throw new Error("CamRapidPay is not configured. Set CAMRAPIDPAY_* env vars.");
    }
    const base = process.env.CAMRAPIDPAY_BASE_URL!.replace(/\/+$/, "");
    const reference = input.reference ?? `FM${Date.now().toString(36).toUpperCase()}`;

    const res = await fetch(`${base}/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CAMRAPIDPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountUsd,
        currency: "USD",
        reference,
        description: input.description ?? `FitMeal ${input.tier} (1 month)`,
        return_url: process.env.PAYWAY_RETURN_URL ?? undefined,
      }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      transaction_id?: string;
      qr_data?: string;
      qr_image_url?: string;
      expires_at?: string;
      checkout_url?: string;
      message?: string;
    };
    if (!res.ok || !json.transaction_id) {
      throw new Error(
        `CamRapidPay create failed: ${res.status} ${json.message ?? ""}`.trim(),
      );
    }

    return {
      paymentRequestId: "",
      providerSessionId: json.transaction_id,
      qrPayload: json.qr_data,
      qrImageUrl: json.qr_image_url,
      checkoutUrl: json.checkout_url,
      expiresAt:
        json.expires_at ?? new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      rawResponse: json,
    };
  }

  async checkStatus(transactionId: string): Promise<PaymentStatusResult> {
    if (!this.isConfigured()) throw new Error("CamRapidPay is not configured.");
    const base = process.env.CAMRAPIDPAY_BASE_URL!.replace(/\/+$/, "");
    const res = await fetch(`${base}/v1/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${process.env.CAMRAPIDPAY_API_KEY}` },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      status?: string;
      paid_amount?: number;
      currency?: string;
    };
    return {
      status: mapStatus(json.status),
      paidAmount:
        mapStatus(json.status) === "approved"
          ? { value: Number(json.paid_amount ?? 0), currency: String(json.currency ?? "USD") }
          : undefined,
      providerReference: transactionId,
      rawResponse: json,
    };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<
    | { providerSessionId: string; status: PaymentSessionStatus; raw: unknown }
    | null
  > {
    const secret = process.env.CAMRAPIDPAY_WEBHOOK_SECRET;
    const sig = headers["x-signature"] ?? headers["X-Signature"];
    if (!secret || !sig) return null;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    let ok = false;
    try {
      ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig)));
    } catch {
      ok = false;
    }
    if (!ok) return null;
    let body: { transaction_id?: string; status?: string } = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!body.transaction_id) return null;
    return {
      providerSessionId: body.transaction_id,
      status: mapStatus(body.status),
      raw: body,
    };
  }
}

function mapStatus(s: string | null | undefined): PaymentSessionStatus {
  switch ((s ?? "").toLowerCase()) {
    case "paid":
    case "completed":
    case "success":
    case "approved":
      return "approved";
    case "expired":
      return "expired";
    case "failed":
    case "rejected":
    case "canceled":
    case "cancelled":
      return "rejected";
    default:
      return "pending";
  }
}
