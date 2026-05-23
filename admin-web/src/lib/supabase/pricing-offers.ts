import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";

/**
 * Admin-tunable pricing offers per paid tier (Silver, Gold). Two
 * independent levers per tier:
 *
 *   - Free trial: N days where the user gets paid-tier features at $0.
 *   - First-payment discount: percent off the first paid month.
 *
 * Each lever has its own enable/disable toggle and audience filter so
 * an admin can run "50% off first month for Cambodia only, Q1 2026" or
 * "3-day trial for first-time subscribers" without touching code.
 *
 * Stored as flat keys in `app_settings` so the existing audit trigger
 * (migration 0013) and RLS policy keep working unchanged.
 *
 * Mobile clients consume the resolved offers via /api/payments/options;
 * the actual price charged on StoreKit / Play Billing is configured
 * separately in App Store Connect / Play Console (admin sees a yellow
 * reminder note next to the discount fields).
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
  /** ISO-8601 timestamp. null = always available while enabled. */
  startsAt: string | null;
  /** ISO-8601 timestamp. null = no end date. */
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

const DEFAULT_TIER: TierOffers = {
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

const DEFAULT_OFFERS: PricingOffers = {
  silver: { ...DEFAULT_TIER, trial: { enabled: false, days: 3, audience: "first_time" } },
  gold: DEFAULT_TIER,
};

const TIERS = ["silver", "gold"] as const;
type TierId = (typeof TIERS)[number];

/** Build the flat list of app_settings keys we care about. */
function tierKeys(tier: TierId) {
  return {
    trialEnabled: `pricing.${tier}.trial.enabled`,
    trialDays: `pricing.${tier}.trial.days`,
    trialAudience: `pricing.${tier}.trial.audience`,
    discountEnabled: `pricing.${tier}.discount.enabled`,
    discountPercent: `pricing.${tier}.discount.percent_off`,
    discountAudience: `pricing.${tier}.discount.audience`,
    discountCountry: `pricing.${tier}.discount.country`,
    discountStartsAt: `pricing.${tier}.discount.starts_at`,
    discountEndsAt: `pricing.${tier}.discount.ends_at`,
  } as const;
}

function allKeys(): string[] {
  return TIERS.flatMap((t) => Object.values(tierKeys(t)));
}

function readBool(rows: Map<string, unknown>, key: string, fallback: boolean): boolean {
  const v = rows.get(key);
  return typeof v === "boolean" ? v : fallback;
}

function readInt(rows: Map<string, unknown>, key: string, fallback: number): number {
  const v = rows.get(key);
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;
}

function readString(rows: Map<string, unknown>, key: string, fallback: string): string {
  const v = rows.get(key);
  return typeof v === "string" ? v : fallback;
}

function readAudience(
  rows: Map<string, unknown>,
  key: string,
  fallback: Audience,
): Audience {
  const v = readString(rows, key, fallback);
  return v === "first_time" || v === "everyone" || v === "by_country" ? v : fallback;
}

function readDate(
  rows: Map<string, unknown>,
  key: string,
  fallback: string | null,
): string | null {
  const v = rows.get(key);
  if (typeof v === "string" && v.trim().length > 0) return v;
  if (v === null || v === undefined) return fallback;
  return fallback;
}

export async function getPricingOffers(): Promise<PricingOffers> {
  if (!isSupabaseConfigured()) return DEFAULT_OFFERS;
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("app_settings")
      .select("key,value")
      .in("key", allKeys());
    if (error || !data) return DEFAULT_OFFERS;

    const rows = new Map<string, unknown>(
      (data as { key: string; value: unknown }[]).map((r) => [r.key, r.value]),
    );

    const readTier = (tier: TierId): TierOffers => {
      const k = tierKeys(tier);
      const fallback = DEFAULT_OFFERS[tier];
      return {
        trial: {
          enabled: readBool(rows, k.trialEnabled, fallback.trial.enabled),
          days: readInt(rows, k.trialDays, fallback.trial.days),
          audience: readAudience(rows, k.trialAudience, fallback.trial.audience),
        },
        discount: {
          enabled: readBool(rows, k.discountEnabled, fallback.discount.enabled),
          percentOff: readInt(
            rows,
            k.discountPercent,
            fallback.discount.percentOff,
          ),
          audience: readAudience(rows, k.discountAudience, fallback.discount.audience),
          country: readString(rows, k.discountCountry, fallback.discount.country),
          startsAt: readDate(rows, k.discountStartsAt, fallback.discount.startsAt),
          endsAt: readDate(rows, k.discountEndsAt, fallback.discount.endsAt),
        },
      };
    };

    return { silver: readTier("silver"), gold: readTier("gold") };
  } catch {
    return DEFAULT_OFFERS;
  }
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.trunc(n)));
}
function clampDays(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(60, Math.trunc(n)));
}

function sanitizeCountry(s: string): string {
  const c = s.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : "";
}

function sanitizeDate(s: string | null): string | null {
  if (s === null) return null;
  const t = s.trim();
  if (!t) return null;
  const parsed = new Date(t);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function setPricingOffers(value: PricingOffers): Promise<void> {
  const sb = getSupabaseAdmin();

  const writeTier = (tier: TierId, offers: TierOffers) => {
    const k = tierKeys(tier);
    return [
      { key: k.trialEnabled, value: Boolean(offers.trial.enabled) as unknown },
      { key: k.trialDays, value: clampDays(offers.trial.days) as unknown },
      { key: k.trialAudience, value: offers.trial.audience as unknown },
      { key: k.discountEnabled, value: Boolean(offers.discount.enabled) as unknown },
      { key: k.discountPercent, value: clampPercent(offers.discount.percentOff) as unknown },
      { key: k.discountAudience, value: offers.discount.audience as unknown },
      { key: k.discountCountry, value: sanitizeCountry(offers.discount.country) as unknown },
      { key: k.discountStartsAt, value: sanitizeDate(offers.discount.startsAt) as unknown },
      { key: k.discountEndsAt, value: sanitizeDate(offers.discount.endsAt) as unknown },
    ];
  };

  const rows = [
    ...writeTier("silver", value.silver),
    ...writeTier("gold", value.gold),
  ].map((r) => ({
    key: r.key,
    value: r.value as object,
    description: null as string | null,
  }));

  const { error } = await sb.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

/**
 * Resolve the *effective* offer for a user at a moment in time.
 * Used by /api/payments/options so mobile clients display the right
 * copy without leaking unrelated audience rules.
 */
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
