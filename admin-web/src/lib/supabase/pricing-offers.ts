import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";
import {
  DEFAULT_OFFERS,
  type Audience,
  type PricingOffers,
  type TierOffers,
} from "./pricing-offers-shared";

// Re-export everything from the shared module so existing server-side
// imports of `./pricing-offers` keep working unchanged. Client code
// imports from `./pricing-offers-shared` instead because this file
// pulls in `server-only`.
export * from "./pricing-offers-shared";

const TIERS = ["silver", "gold"] as const;
type TierId = (typeof TIERS)[number];

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
          percentOff: readInt(rows, k.discountPercent, fallback.discount.percentOff),
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
