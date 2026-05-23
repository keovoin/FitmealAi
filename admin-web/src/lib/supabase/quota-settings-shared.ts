/**
 * Isomorphic types and pure helpers for the per-tier quota settings.
 * Safe to import from BOTH client components (the /quotas form) and
 * server code. The DB-touching helpers live in `quota-settings.ts`,
 * which is `server-only` and re-exports everything below so existing
 * server-side import paths keep working.
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

export const DEFAULT_QUOTAS: QuotaSettings = {
  free: { aiPerDay: 1, shufflesPerDay: 10 },
  silver: { aiPerDay: 20, shufflesPerDay: -1 },
  gold: { aiPerDay: 30, shufflesPerDay: -1 },
  shuffleMealCount: 1,
  catalogMinPublishedPerMealType: 5,
};

/** Format a quota for display. -1 ⇒ "Unlimited", 0 ⇒ "Disabled", else number. */
export function formatQuota(n: number): string {
  if (n < 0) return "Unlimited";
  if (n === 0) return "Disabled";
  return String(n);
}
