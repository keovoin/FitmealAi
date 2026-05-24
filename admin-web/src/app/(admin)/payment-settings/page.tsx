import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAbaPaymentSettings } from "@/lib/supabase/app-settings";
import { getPricingOffers } from "@/lib/supabase/pricing-offers";
import { DocLink } from "@/components/ui/doc-link";
import { AbaPaymentToggle } from "./aba-payment-toggle";
import { PricingOffersForm } from "./pricing-offers-form";
import { Banknote, Globe, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Payment settings">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const [aba, offers] = await Promise.all([
    getAbaPaymentSettings(),
    getPricingOffers(),
  ]);

  return (
    <PageShell
      title="Payment settings"
      subtitle="Toggle the manual ABA flow and set the regions where it shows."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* ABA enable/disable + region picker -------------------------------*/}
        <GlassCard
          className="lg:col-span-2"
          data-testid="aba-payment-toggle-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Manual ABA bank transfer
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                Show the &ldquo;Pay with ABA&rdquo; button in mobile apps
              </p>
              <p className="mt-1 text-sm text-white/65">
                Users send a bank transfer in the ABA mobile app, paste the
                transaction ID, attach a screenshot, and an admin reviews
                the receipt in <Link href="/payments" className="text-accent-blue hover:underline">Payments</Link>.
                Off-by-default outside the allowed regions.
              </p>
              <div className="mt-2">
                <DocLink
                  href="https://www.ababank.com/aba-pay-feature/"
                  label="ABA PAY feature"
                />
              </div>
            </div>
            <Banknote className="h-6 w-6 flex-shrink-0 text-accent-blue" />
          </div>

          <AbaPaymentToggle
            initialEnabled={aba.enabled}
            initialAllowedRegions={aba.allowedRegions}
          />
        </GlassCard>

        {/* Pricing offers (trial + first-payment discount) -----------------*/}
        <GlassCard className="lg:col-span-2" data-testid="pricing-offers-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Pricing offers
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                Free trial + first-payment discount per tier
              </p>
              <p className="mt-1 text-sm text-white/65">
                Toggle a free trial and / or a first-payment discount on
                Silver and Gold independently. Each can target first-time
                subscribers, everyone, or a specific country, with optional
                start / end dates.
              </p>
              <div className="mt-2">
                <DocLink
                  href="https://developer.apple.com/app-store/subscriptions/"
                  label="App Store intro offers"
                  inline
                />
              </div>
            </div>
            <Sparkles className="h-6 w-6 flex-shrink-0 text-accent-purple" />
          </div>

          <PricingOffersForm initial={offers} />
        </GlassCard>

        {/* Region cheatsheet ----------------------------------------------*/}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Region detection
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                How we know a user is in Cambodia
              </p>
              <p className="mt-1 text-sm text-white/65">
                When the mobile app calls{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
                  /api/payments/options
                </code>
                , the server reads the country from these headers in order:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/75">
                <li>
                  <code className="text-xs">x-vercel-ip-country</code> &mdash; auto-set
                  by Vercel for every deployment{" "}
                  <DocLink
                    href="https://vercel.com/docs/edge-network/headers/request-headers#x-vercel-ip-country"
                    label="Vercel docs"
                    inline
                  />
                </li>
                <li>
                  <code className="text-xs">cf-ipcountry</code> &mdash; Cloudflare proxy fallback
                </li>
                <li>
                  <code className="text-xs">x-country</code> &mdash; custom override
                </li>
                <li>
                  <code className="text-xs">accept-language</code> &mdash; best-effort
                  for local dev
                </li>
                <li>
                  <code className="text-xs">DEV_FORCE_COUNTRY</code> env &mdash; local
                  dev override
                </li>
              </ol>
            </div>
            <Globe className="h-6 w-6 flex-shrink-0 text-success" />
          </div>
        </GlassCard>

        {/* Store billing -------------------------------------------------*/}
        <GlassCard data-testid="storekit-card" className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                In-app subscriptions
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                Apple StoreKit 2 + Google Play Billing
              </p>
              <p className="mt-1 text-sm text-white/65">
                Product IDs (must match in both stores):
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="font-mono text-xs text-white/85">
                  fitmeal.silver.monthly
                </li>
                <li className="font-mono text-xs text-white/85">
                  fitmeal.gold.monthly
                </li>
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DocLink
                  href="https://appstoreconnect.apple.com/"
                  label="App Store Connect"
                />
                <DocLink
                  href="https://play.google.com/console"
                  label="Google Play Console"
                />
              </div>
            </div>
            <Wallet className="h-6 w-6 flex-shrink-0 text-gold-start" />
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
