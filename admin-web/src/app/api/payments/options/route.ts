import { NextRequest, NextResponse } from "next/server";
import { resolveCountryCode } from "@/lib/geo";
import {
  getAbaPaymentSettings,
  isAbaAvailableForRegion,
} from "@/lib/supabase/app-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/payments/options
 *
 * Mobile clients call this when opening the paywall / payment sheet to
 * decide which payment buttons to render. The response is computed
 * server-side from:
 *   1. `app_settings.aba_payment.enabled`  - admin toggle
 *   2. `app_settings.aba_payment.allowed_regions` - ISO country list
 *   3. The caller's IP-resolved country (Vercel/Cloudflare headers)
 *
 * Cache-Control: no-store. Settings flip live the moment the admin
 * toggles the switch.
 */
export async function GET(req: NextRequest) {
  const aba = await getAbaPaymentSettings();
  const country = resolveCountryCode(req.headers);
  const abaAvailable = isAbaAvailableForRegion(aba, country);

  return NextResponse.json(
    {
      // High-level toggle for the manual ABA bank-transfer button. Mobile
      // clients should hide that button when this is false.
      aba_payment: {
        enabled: aba.enabled,
        allowed_regions: aba.allowedRegions,
        available_for_user: abaAvailable,
      },
      // Echoed back so debug/QA can see what country the edge resolved.
      // Mobile clients SHOULD NOT rely on this for any business logic;
      // use `aba_payment.available_for_user` instead.
      detected_country: country,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
