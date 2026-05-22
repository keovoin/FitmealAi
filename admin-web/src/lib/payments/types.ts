import type { SubscriptionTier } from "@/data/types";

/**
 * Common payment provider abstraction. The admin / mobile app talks to
 * `/api/payments/*` only — those routes pick the right provider via this
 * interface, so swapping providers is a deploy-time decision.
 *
 * Three providers ship today:
 *
 *  1. BakongKhqrProvider     - generates QR locally with the npm `bakong-khqr`
 *                              package. Uses the National Bank of Cambodia
 *                              Bakong API for status polling. Cheapest, no
 *                              middleman fees.
 *
 *  2. AbaPayWayProvider      - Cambodia's largest gateway. Supports KHQR +
 *                              ABA PAY + Visa/Mastercard + WeChat/Alipay.
 *                              Hash-signed REST. Best when you also want
 *                              card payments.
 *
 *  3. CamRapidPayProvider    - Managed Bakong KHQR gateway. Drop-in REST
 *                              with webhook callbacks. Useful when you
 *                              don't want to manage Bakong tokens yourself.
 *
 *  The legacy "manual_aba" review queue is still supported and lives outside
 *  this interface — it does not implement `createSession`.
 */

export type PaymentProviderId =
  | "bakong_khqr"
  | "aba_payway"
  | "camrapidpay"
  | "manual_aba";

export interface CreatePaymentInput {
  userId: string;
  tier: SubscriptionTier;
  amountUsd: number;          // 9.99
  description?: string;
  // optional metadata that flows back through to the webhook / status endpoint
  reference?: string;
}

export interface CreatePaymentResult {
  /** Our DB row id — clients use this to poll status. */
  paymentRequestId: string;
  /** Provider's own session/transaction id (for cross-reference + webhook lookup). */
  providerSessionId: string;
  /** EMVCo / KHQR raw payload (mobile decodes into a QR code). */
  qrPayload?: string;
  /** Pre-rendered PNG/SVG URL when the provider hosts the QR. */
  qrImageUrl?: string;
  /** When the QR / session expires; clients should stop polling after this. */
  expiresAt: string;          // ISO string
  /** Provider-specific deep link (Bakong app), useful as a "Open in Bakong" button. */
  deepLink?: string;
  /** For card-based providers (ABA PayWay), URL to redirect into the hosted page. */
  checkoutUrl?: string;
  /** Raw provider response, stored in DB for debugging / auditing. */
  rawResponse: unknown;
}

export type PaymentSessionStatus =
  | "pending"
  | "approved"
  | "expired"
  | "rejected";

export interface PaymentStatusResult {
  status: PaymentSessionStatus;
  /** Final amount + currency the user actually paid. */
  paidAmount?: { value: number; currency: string };
  /** Provider's reference (e.g. transaction hash / payment ID). */
  providerReference?: string;
  rawResponse?: unknown;
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  /** Whether the provider is fully configured (env vars present). */
  isConfigured(): boolean;
  /** Create a new payment session. */
  createSession(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Poll the gateway for the latest status. */
  checkStatus(providerSessionId: string): Promise<PaymentStatusResult>;
  /**
   * Verify and parse a provider webhook payload. Implementations must
   * cryptographically validate the signature header to prevent forgery.
   * Returns null if the signature is invalid.
   */
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<{
    providerSessionId: string;
    status: PaymentSessionStatus;
    raw: unknown;
  } | null>;
}

export interface PriceForTier {
  amountUsd: number;
  amountKhrMinor?: number;    // optional KHR minor units for KHQR
  display: string;
}

/**
 * Single source of truth for plan prices. Mirrors iOS `MockData.plans`
 * and Android `MockData.plans`. Update here, mobile reads via
 * `/api/payments/plans` if it ever needs server-driven pricing.
 */
export const PLAN_PRICES: Record<Exclude<SubscriptionTier, "Free">, PriceForTier> = {
  Silver: { amountUsd: 4.99, display: "$4.99" },
  Gold:   { amountUsd: 9.99, display: "$9.99" },
};
