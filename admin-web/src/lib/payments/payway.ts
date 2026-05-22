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
 * ABA PayWay provider.
 *
 * Cambodia's largest payment gateway (operated by ABA Bank). Supports
 * KHQR, ABA PAY, Visa/Mastercard, WeChat Pay, Alipay through one hosted
 * checkout page.
 *
 * Required env (Vercel):
 *   - PAYWAY_MERCHANT_ID
 *   - PAYWAY_API_KEY
 *   - PAYWAY_BASE_URL          e.g. https://checkout-sandbox.payway.com.kh
 *                              prod: https://checkout.payway.com.kh
 *   - PAYWAY_RETURN_URL        Where the hosted page redirects after pay
 *
 * Reference: https://developer.payway.com.kh/
 *
 * Auth: every request body is signed with HMAC-SHA512 using the API key.
 * The server signs `req_time + merchant_id + tran_id + amount + items +
 * shipping + firstname + lastname + email + phone + type + payment_option +
 * return_url + cancel_url + continue_success_url + return_deeplink + currency +
 * custom_fields + return_params` (the canonical ordering documented by ABA).
 */
export class AbaPayWayProvider implements PaymentProvider {
  readonly id = "aba_payway" as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.PAYWAY_MERCHANT_ID &&
        process.env.PAYWAY_API_KEY &&
        process.env.PAYWAY_BASE_URL,
    );
  }

  async createSession(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) {
      throw new Error("ABA PayWay is not configured. Set PAYWAY_* env vars.");
    }
    const reqTime = nowYmdHis();        // YYYYMMDDHHmmss in UTC
    const tranId = `FM${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const amount = input.amountUsd.toFixed(2);
    const items = base64Json([
      {
        name: `FitMeal ${input.tier} (1 month)`,
        quantity: 1,
        price: amount,
      },
    ]);
    const returnUrl = process.env.PAYWAY_RETURN_URL ?? "";
    const continueSuccessUrl = returnUrl;
    const currency = "USD";
    const type = "purchase";
    const paymentOption = "abapay_khqr";  // KHQR through ABA — auto-fallback to card if user prefers

    // Canonical order from ABA's docs.
    const hashSource =
      reqTime +
      process.env.PAYWAY_MERCHANT_ID +
      tranId +
      amount +
      items +
      "" /* shipping */ +
      "" /* firstname */ +
      "" /* lastname */ +
      "" /* email */ +
      "" /* phone */ +
      type +
      paymentOption +
      returnUrl +
      "" /* cancel_url */ +
      continueSuccessUrl +
      "" /* return_deeplink */ +
      currency +
      "" /* custom_fields */ +
      ""; /* return_params */

    const hash = crypto
      .createHmac("sha512", process.env.PAYWAY_API_KEY!)
      .update(hashSource)
      .digest("base64");

    const baseUrl = process.env.PAYWAY_BASE_URL!.replace(/\/+$/, "");
    const purchaseUrl = `${baseUrl}/api/payment-gateway/v1/payments/purchase`;

    const body = new URLSearchParams({
      req_time: reqTime,
      merchant_id: process.env.PAYWAY_MERCHANT_ID!,
      tran_id: tranId,
      amount,
      items,
      currency,
      type,
      payment_option: paymentOption,
      return_url: returnUrl,
      continue_success_url: continueSuccessUrl,
      hash,
    });

    const res = await fetch(purchaseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });
    const text = await res.text();
    const json = safeJson(text);

    if (!res.ok) {
      throw new Error(`ABA PayWay create failed: ${res.status} ${text.slice(0, 200)}`);
    }

    // PayWay responses include `qr_string` for KHQR or `checkout_url`
    // for hosted card checkout, depending on payment_option.
    const qrPayload = (json?.qr_string as string | undefined) ?? undefined;
    const checkoutUrl = (json?.checkout_url as string | undefined) ?? `${baseUrl}/payment?tran_id=${tranId}`;

    return {
      paymentRequestId: "",
      providerSessionId: tranId,
      qrPayload,
      checkoutUrl,
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      rawResponse: json ?? text,
    };
  }

  async checkStatus(tranId: string): Promise<PaymentStatusResult> {
    if (!this.isConfigured()) throw new Error("ABA PayWay is not configured.");
    const reqTime = nowYmdHis();
    const baseUrl = process.env.PAYWAY_BASE_URL!.replace(/\/+$/, "");
    const url = `${baseUrl}/api/payment-gateway/v1/payments/check-transaction`;

    const hashSource =
      reqTime + process.env.PAYWAY_MERCHANT_ID + tranId;
    const hash = crypto
      .createHmac("sha512", process.env.PAYWAY_API_KEY!)
      .update(hashSource)
      .digest("base64");

    const body = new URLSearchParams({
      req_time: reqTime,
      merchant_id: process.env.PAYWAY_MERCHANT_ID!,
      tran_id: tranId,
      hash,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      payment_status?: string;
      tran_id?: string;
      total_amount?: string;
      original_currency?: string;
    };
    const status = mapPaywayStatus(json.payment_status);
    return {
      status,
      providerReference: json.tran_id,
      paidAmount:
        status === "approved" && json.total_amount
          ? { value: Number(json.total_amount), currency: json.original_currency ?? "USD" }
          : undefined,
      rawResponse: json,
    };
  }

  /**
   * PayWay sends a webhook to `return_url` with a `hash` form field. We
   * verify it with the same HMAC-SHA512 over the canonical body fields.
   */
  async verifyWebhook(
    rawBody: string,
    _headers: Record<string, string>,
  ): Promise<
    | { providerSessionId: string; status: PaymentSessionStatus; raw: unknown }
    | null
  > {
    if (!this.isConfigured()) return null;
    const params = new URLSearchParams(rawBody);
    const tranId = params.get("tran_id");
    const status = params.get("status") ?? params.get("payment_status");
    const sentHash = params.get("hash");
    if (!tranId || !sentHash) return null;
    const reqTime = params.get("req_time") ?? "";
    const expected = crypto
      .createHmac("sha512", process.env.PAYWAY_API_KEY!)
      .update(reqTime + process.env.PAYWAY_MERCHANT_ID + tranId + (status ?? ""))
      .digest("base64");
    if (
      !crypto.timingSafeEqual(
        Buffer.from(sentHash),
        Buffer.from(expected.slice(0, sentHash.length)),
      )
    ) {
      return null;
    }
    return {
      providerSessionId: tranId,
      status: mapPaywayStatus(status),
      raw: Object.fromEntries(params.entries()),
    };
  }
}

function mapPaywayStatus(s: string | null | undefined): PaymentSessionStatus {
  switch ((s ?? "").toLowerCase()) {
    case "00":
    case "0":
    case "approved":
    case "success":
      return "approved";
    case "expired":
      return "expired";
    case "rejected":
    case "failed":
    case "declined":
      return "rejected";
    default:
      return "pending";
  }
}

function nowYmdHis(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function base64Json(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

function safeJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}
