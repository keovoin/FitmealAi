/**
 * Isomorphic types + pure resolver for the trial / first-payment-discount
 * pricing-offer config. Safe to import from BOTH client components
 * (the /payment-settings offers form) and server code (admin actions,
 * /api/payments/options). The DB helpers live in `pricing-offers.ts`,
 * which is `server-only` and re-exports everything below.
 */

export type Audience = "first_time" | "everyone" | "by_country";

export interface TrialConfig {
  enabled: boolean;
  days: number;
  audience: Audience;
}

export interface DiscountConfig {
  enabled: boolean;
  percentOff: number;
  audience: Audience;
  /** ISO-3166-1 alpha-2 (uppercase). Only used when audience = by_country. */
  country: string;
  startsAt: string | null;
  endsAt: string | null;
}

export interface TierOffers {
  trial: TrialConfig;
  discount: DiscountConfig;
}

export interface PricingOffers {
  silver: TierOffers;
  gold: TierOffers;
}

export const DEFAULT_TIER: TierOffers = {
  trial: { enabled: false, days: 0, audience: "first_time" },
  discount: {
    enabled: false,
    percentOff: 50,
    audience: "first_time",
    country: "",
    startsAt: null,
    endsAt: null,
  },
};

export const DEFAULT_OFFERS: PricingOffers = {
  silver: { ...DEFAULT_TIER, trial: { enabled: false, days: 3, audience: "first_time" } },
  gold: DEFAULT_TIER,
};

export interface ResolvedOffer {
  trialDays: number; // 0 when no trial
  discountPercent: number; // 0 when no discount
}

export interface OfferContext {
  /** True when the user has never had ANY paid subscription before. */
  isFirstTime: boolean;
  /** Detected ISO-3166-1 alpha-2 country code, uppercase. */
  countryCode: string | null;
  /** Reference time for starts_at / ends_at comparisons. */
  now?: Date;
}

/**
 * Pure resolver: given a tier's stored offers + a user context, return
 * the effective trial days + discount percent. Used both server-side
 * (in /api/payments/options) and from the admin's preview UI.
 */
export function resolveOfferForTier(
  tierOffers: TierOffers,
  ctx: OfferContext,
): ResolvedOffer {
  const now = ctx.now ?? new Date();
  const cc = (ctx.countryCode ?? "").toUpperCase();

  // Trial -----------------------------------------------------------------
  let trialDays = 0;
  if (tierOffers.trial.enabled && tierOffers.trial.days > 0) {
    if (
      tierOffers.trial.audience === "everyone" ||
      (tierOffers.trial.audience === "first_time" && ctx.isFirstTime)
    ) {
      trialDays = tierOffers.trial.days;
    }
  }

  // Discount --------------------------------------------------------------
  let discountPercent = 0;
  const d = tierOffers.discount;
  if (d.enabled && d.percentOff > 0) {
    const startsAtOk = !d.startsAt || new Date(d.startsAt).getTime() <= now.getTime();
    const endsAtOk = !d.endsAt || new Date(d.endsAt).getTime() >= now.getTime();
    if (startsAtOk && endsAtOk) {
      const audienceMatch =
        d.audience === "everyone" ||
        (d.audience === "first_time" && ctx.isFirstTime) ||
        (d.audience === "by_country" && cc.length === 2 && cc === d.country.toUpperCase());
      if (audienceMatch) discountPercent = d.percentOff;
    }
  }

  return { trialDays, discountPercent };
}
