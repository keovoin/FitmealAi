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
 * Direct Bakong KHQR provider.
 *
 * Generates KHQR EMVCo merchant-presented payloads locally using the
 * `bakong-khqr` npm package, then asks Bakong's transaction API whether
 * the QR has been paid. No gateway in the middle, no per-transaction fees.
 *
 * Required env (set in Vercel):
 *   - BAKONG_API_TOKEN          Developer token from bakong.nbc.gov.kh
 *   - BAKONG_BAKONG_ACCOUNT_ID  e.g. "fitmeal@aclb"  (your Bakong account)
 *   - BAKONG_MERCHANT_NAME      e.g. "FitMeal AI"
 *   - BAKONG_MERCHANT_CITY      e.g. "Phnom Penh"
 *   - (optional) BAKONG_API_BASE  defaults to https://api-bakong.nbc.gov.kh/v1
 *
 * The bakong-khqr package is loaded lazily via dynamic import so the
 * server build doesn't fail when the env vars are not yet configured.
 *
 * Reference: https://bakong.nbc.gov.kh/  (Bakong developer docs)
 */
export class BakongKhqrProvider implements PaymentProvider {
  readonly id = "bakong_khqr" as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.BAKONG_API_TOKEN &&
        process.env.BAKONG_BAKONG_ACCOUNT_ID &&
        process.env.BAKONG_MERCHANT_NAME,
    );
  }

  async createSession(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) {
      throw new Error("Bakong KHQR is not configured. Set BAKONG_* env vars.");
    }

    // bakong-khqr is an optional dependency; load lazily so the build
    // doesn't break when the package or env aren't installed.
    const mod = await loadBakongKhqr();

    const merchantInfo = new mod.MerchantInfo(
      process.env.BAKONG_BAKONG_ACCOUNT_ID!,
      process.env.BAKONG_MERCHANT_NAME!,
      process.env.BAKONG_MERCHANT_CITY ?? "Phnom Penh",
      // billNumber: short string, becomes the merchant reference. We use the
      // first 12 chars of a UUID so the user can quote it back to support.
      genReference(),
      undefined, // mobileNumber
      "FitMeal Subscription",
      input.amountUsd,
      "USD",
      undefined, // expirationTimestamp - we set our own below
      undefined, // mcc
    );

    const khqr = new mod.BakongKHQR();
    // The library returns { data: { qr: <emvco-string>, md5: <hash> } }.
    const generated = khqr.generateMerchant(merchantInfo);
    const qrPayload = String(generated?.data?.qr ?? "");
    const md5Hash = String(generated?.data?.md5 ?? "");
    if (!qrPayload || !md5Hash) {
      throw new Error("bakong-khqr returned an empty payload");
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30m

    return {
      paymentRequestId: "",         // filled in by the API route
      providerSessionId: md5Hash,   // Bakong status checks key off this hash
      qrPayload,
      expiresAt,
      // Bakong has a deep-link convention for the BAKONG app; mobile clients
      // can append qrPayload to bakong://qr?text=… so users can hop straight
      // into the app instead of scanning their own screen.
      deepLink: `bakong://qr?text=${encodeURIComponent(qrPayload)}`,
      rawResponse: { md5: md5Hash, billNumber: merchantInfo.billNumber },
    };
  }

  async checkStatus(md5Hash: string): Promise<PaymentStatusResult> {
    if (!this.isConfigured()) {
      throw new Error("Bakong KHQR is not configured.");
    }
    const base = (process.env.BAKONG_API_BASE ?? "https://api-bakong.nbc.gov.kh/v1").replace(
      /\/+$/,
      "",
    );
    const res = await fetch(`${base}/check_transaction_by_md5`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BAKONG_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ md5: md5Hash }),
      // Don't cache; balance and status change.
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      responseCode?: number;
      responseMessage?: string;
      data?: { hash?: string; amount?: number; currency?: string };
    };

    // Bakong responds with responseCode 0 when the transaction is found and paid.
    let status: PaymentSessionStatus = "pending";
    if (json.responseCode === 0 && json.data?.hash) status = "approved";
    if (json.responseMessage?.toLowerCase()?.includes("expired")) status = "expired";

    return {
      status,
      paidAmount:
        status === "approved" && json.data
          ? {
              value: Number(json.data.amount ?? 0),
              currency: String(json.data.currency ?? "USD"),
            }
          : undefined,
      providerReference: json.data?.hash,
      rawResponse: json,
    };
  }

  /**
   * Bakong itself doesn't push webhooks — status is poll-only. We expose
   * a verifyWebhook for symmetry with the other providers and to allow
   * an internal cron / Edge Function to push a "found" event into our
   * pipeline using a shared secret (BAKONG_INTERNAL_WEBHOOK_SECRET).
   */
  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<
    | { providerSessionId: string; status: PaymentSessionStatus; raw: unknown }
    | null
  > {
    const secret = process.env.BAKONG_INTERNAL_WEBHOOK_SECRET;
    const sig = headers["x-internal-signature"] ?? headers["X-Internal-Signature"];
    if (!secret || !sig) return null;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig)));
    if (!ok) return null;
    let body: { md5?: string; status?: PaymentSessionStatus } = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!body.md5 || !body.status) return null;
    return { providerSessionId: body.md5, status: body.status, raw: body };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genReference(): string {
  return `FM${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

interface BakongKhqrModule {
  BakongKHQR: new () => {
    generateMerchant: (merchant: unknown) => {
      data?: { qr?: string; md5?: string };
    };
  };
  MerchantInfo: new (...args: unknown[]) => unknown;
  IndividualInfo?: new (...args: unknown[]) => unknown;
}

let cached: BakongKhqrModule | null = null;
async function loadBakongKhqr(): Promise<BakongKhqrModule> {
  if (cached) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (await import("bakong-khqr")) as any;
    cached = (mod.default ?? mod) as BakongKhqrModule;
    return cached;
  } catch {
    throw new Error(
      "The 'bakong-khqr' npm package is not installed. " +
        "Run: npm install bakong-khqr  (in the admin-web directory).",
    );
  }
}
