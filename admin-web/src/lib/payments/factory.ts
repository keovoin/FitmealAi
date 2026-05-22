import "server-only";
import { BakongKhqrProvider } from "./bakong";
import { AbaPayWayProvider } from "./payway";
import { CamRapidPayProvider } from "./camrapidpay";
import type { PaymentProvider, PaymentProviderId } from "./types";

/**
 * Returns the payment provider implementation requested by the caller.
 * Supports a forced override via env (`PAYMENT_PROVIDER_DEFAULT`) for the
 * "no override" path so a deploy can flip the default without a code
 * change.
 *
 * The legacy 'manual_aba' value is intentionally not handled here — manual
 * payments still flow through the existing review queue and don't talk to
 * any external API.
 */
export function getPaymentProvider(id?: PaymentProviderId): PaymentProvider {
  const target =
    id && id !== "manual_aba"
      ? id
      : (process.env.PAYMENT_PROVIDER_DEFAULT as PaymentProviderId | undefined) ??
        "bakong_khqr";
  switch (target) {
    case "bakong_khqr":
      return new BakongKhqrProvider();
    case "aba_payway":
      return new AbaPayWayProvider();
    case "camrapidpay":
      return new CamRapidPayProvider();
    default:
      throw new Error(`Unsupported payment provider: ${target}`);
  }
}

/** Snapshot of every provider's configuration state (used by /setup page). */
export function getProviderConfigSnapshot(): {
  id: PaymentProviderId;
  configured: boolean;
  description: string;
}[] {
  return [
    {
      id: "bakong_khqr",
      configured: new BakongKhqrProvider().isConfigured(),
      description: "Direct Bakong KHQR (no fees, requires Bakong dev token).",
    },
    {
      id: "aba_payway",
      configured: new AbaPayWayProvider().isConfigured(),
      description: "ABA PayWay hosted checkout (KHQR + ABA PAY + cards).",
    },
    {
      id: "camrapidpay",
      configured: new CamRapidPayProvider().isConfigured(),
      description: "CamRapidPay managed Bakong KHQR gateway.",
    },
    {
      id: "manual_aba",
      configured: true,
      description: "Manual ABA receipt review (always available as fallback).",
    },
  ];
}
