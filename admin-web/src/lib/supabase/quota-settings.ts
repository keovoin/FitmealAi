import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";

/**
 * Admin-tunable per-tier daily quotas. Lives in `app_settings` so we can
 * flip the numbers from the /quotas admin page without a redeploy.
 *
 * The SQL function `check_ai_rate_limit()` reads the same rows for the
 * AI cap, and `bump_quota()` reads them for shuffle counting. Keeping
 * the source of truth in app_settings means there's exactly one place
 * to change.
 *
 * Sentinel: -1 means "unlimited" for shuffle limits.
 */

export const QUOTA_KEYS = {
  freeAi: "quotas.free.ai_per_day",
  freeShuffles: "quotas.free.shuffles_per_day",
  silverAi: "quotas.silver.ai_per_day",
  silverShuffles: "quotas.silver.shuffles_per_day",
  goldAi: "quotas.gold.ai_per_day",
  goldShuffles: "quotas.gold.shuffles_per_day",
  shuffleMealCount: "quotas.shuffle_meal_count",
  catalogMinPublishedPerMealType: "quotas.catalog_min_published_per_meal_type",
} as const;

export interface QuotaSettings {
  free: { aiPerDay: number; shufflesPerDay: number };
  silver: { aiPerDay: number; shufflesPerDay: number };
  gold: { aiPerDay: number; shufflesPerDay: number };
  /** Recipes returned per shuffle. */
  shuffleMealCount: number;
  /** Hide the mobile Shuffle button until at least this many published
   *  recipes exist for the user's requested meal_type. */
  catalogMinPublishedPerMealType: number;
}

const DEFAULT_QUOTAS: QuotaSettings = {
  free: { aiPerDay: 1, shufflesPerDay: 10 },
  silver: { aiPerDay: 20, shufflesPerDay: -1 },
  gold: { aiPerDay: 30, shufflesPerDay: -1 },
  shuffleMealCount: 1,
  catalogMinPublishedPerMealType: 5,
};

function readInt(rows: { key: string; value: unknown }[], key: string, fallback: number): number {
  const v = rows.find((r) => r.key === key)?.value;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  return fallback;
}

export async function getQuotaSettings(): Promise<QuotaSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_QUOTAS;
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("app_settings")
      .select("key,value")
      .in("key", Object.values(QUOTA_KEYS));
    if (error || !data) return DEFAULT_QUOTAS;
    const rows = data as { key: string; value: unknown }[];

    return {
      free: {
        aiPerDay: readInt(rows, QUOTA_KEYS.freeAi, DEFAULT_QUOTAS.free.aiPerDay),
        shufflesPerDay: readInt(
          rows,
          QUOTA_KEYS.freeShuffles,
          DEFAULT_QUOTAS.free.shufflesPerDay,
        ),
      },
      silver: {
        aiPerDay: readInt(rows, QUOTA_KEYS.silverAi, DEFAULT_QUOTAS.silver.aiPerDay),
        shufflesPerDay: readInt(
          rows,
          QUOTA_KEYS.silverShuffles,
          DEFAULT_QUOTAS.silver.shufflesPerDay,
        ),
      },
      gold: {
        aiPerDay: readInt(rows, QUOTA_KEYS.goldAi, DEFAULT_QUOTAS.gold.aiPerDay),
        shufflesPerDay: readInt(
          rows,
          QUOTA_KEYS.goldShuffles,
          DEFAULT_QUOTAS.gold.shufflesPerDay,
        ),
      },
      shuffleMealCount: readInt(
        rows,
        QUOTA_KEYS.shuffleMealCount,
        DEFAULT_QUOTAS.shuffleMealCount,
      ),
      catalogMinPublishedPerMealType: readInt(
        rows,
        QUOTA_KEYS.catalogMinPublishedPerMealType,
        DEFAULT_QUOTAS.catalogMinPublishedPerMealType,
      ),
    };
  } catch {
    return DEFAULT_QUOTAS;
  }
}

export async function setQuotaSettings(value: QuotaSettings): Promise<void> {
  const sb = getSupabaseAdmin();
  // Sanity-clamp incoming numbers so admins can't accidentally save NaN
  // or negative AI caps. -1 stays valid for shuffle limits (unlimited).
  const clampPositive = (n: number, max = 1_000_000): number => {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, Math.trunc(n)));
  };
  const clampShuffles = (n: number): number => {
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return -1;
    return Math.min(1_000_000, Math.trunc(n));
  };

  const rows = [
    { key: QUOTA_KEYS.freeAi, value: clampPositive(value.free.aiPerDay) },
    { key: QUOTA_KEYS.freeShuffles, value: clampShuffles(value.free.shufflesPerDay) },
    { key: QUOTA_KEYS.silverAi, value: clampPositive(value.silver.aiPerDay) },
    { key: QUOTA_KEYS.silverShuffles, value: clampShuffles(value.silver.shufflesPerDay) },
    { key: QUOTA_KEYS.goldAi, value: clampPositive(value.gold.aiPerDay) },
    { key: QUOTA_KEYS.goldShuffles, value: clampShuffles(value.gold.shufflesPerDay) },
    {
      key: QUOTA_KEYS.shuffleMealCount,
      value: Math.max(1, Math.min(10, Math.trunc(value.shuffleMealCount))),
    },
    {
      key: QUOTA_KEYS.catalogMinPublishedPerMealType,
      value: clampPositive(value.catalogMinPublishedPerMealType, 1000),
    },
  ].map((r) => ({
    key: r.key,
    value: r.value as unknown as object,
    description: null as string | null,
  }));

  const { error } = await sb.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

/**
 * Read today's used counters for a given user. The `bump_quota()` SQL
 * function does the writes; the admin UI mostly cares about reads.
 */
export async function getUserDailyUsage(userId: string): Promise<{
  aiUsed: number;
  shufflesUsed: number;
}> {
  if (!isSupabaseConfigured()) return { aiUsed: 0, shufflesUsed: 0 };
  const sb = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb
    .from("user_daily_quotas")
    .select("ai_used,shuffles_used")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();
  return {
    aiUsed: data?.ai_used ?? 0,
    shufflesUsed: data?.shuffles_used ?? 0,
  };
}

/** Format a quota for display. -1 ⇒ "Unlimited", 0 ⇒ "Disabled", else number. */
export function formatQuota(n: number): string {
  if (n < 0) return "Unlimited";
  if (n === 0) return "Disabled";
  return String(n);
}
