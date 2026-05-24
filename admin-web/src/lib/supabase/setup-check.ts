import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";

/**
 * Detects common "your migrations haven't been run yet" failure modes
 * so the UI can show a clean setup checklist instead of an opaque
 * "Application error".
 *
 * The Postgres error code for "relation does not exist" is `42P01`.
 * Supabase surfaces it through PostgrestError.code. We also fall back
 * to string matching on the message because some Supabase responses
 * arrive without the SQLSTATE.
 */

// IMPORTANT: when you add a migration that introduces a new table,
// (a) add the table name to REQUIRED_TABLES below so /setup health
//     check probes it,
// (b) bump LATEST_MIGRATION_NUMBER so the SetupRequiredBanner tells
//     users to run the new migration.
//
// Both are read by `<SetupRequiredBanner>` and `/setup`, the two
// places admins land on when something goes wrong.
const REQUIRED_TABLES = [
  // 0001-0011 baseline
  "profiles",
  "user_goals",
  "meal_prefs",
  "workout_prefs",
  "meals",
  "meal_plans",
  "meal_plan_items",
  "workout_plans",
  "exercises",
  "habits",
  "habit_logs",
  "subscriptions",
  "payment_requests",
  "ai_generations",
  "app_settings",
  // 0014_push_tokens_and_referrals
  "push_tokens",
  "notification_prefs",
  "referral_codes",
  "referrals",
  // 0016_quotas_and_recipes
  "recipes",
  "user_daily_quotas",
] as const;

/**
 * Highest-numbered migration in `supabase/migrations/`. Surfaced in the
 * SetupRequiredBanner copy so admins know how many files to paste into
 * the SQL editor.
 *
 * Update this whenever you add a new `NNNN_*.sql` migration.
 */
export const LATEST_MIGRATION_NUMBER = 18;

export type RequiredTable = (typeof REQUIRED_TABLES)[number];

export interface MissingTablesReport {
  /** True when at least one expected table is missing. */
  hasMissing: boolean;
  /** Table names that returned a "relation does not exist" error. */
  missing: RequiredTable[];
  /** Tables that returned some other error (e.g. RLS). */
  errored: { table: RequiredTable; message: string }[];
  /** Tables that responded successfully. */
  ready: RequiredTable[];
}

export interface MigrationsHint {
  isMissingTable: boolean;
  rawMessage: string;
}

/**
 * Inspect a thrown error from a Supabase query and figure out whether
 * it's the "tables not created yet" failure. Catches the most common
 * shapes:
 *   - PostgrestError with code 42P01
 *   - { message: 'relation "public.profiles" does not exist' }
 *   - generic Error with the same message
 */
export function classifySupabaseError(err: unknown): MigrationsHint {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : JSON.stringify(err);

  const lc = raw.toLowerCase();
  const isMissing =
    lc.includes("relation") && lc.includes("does not exist") ||
    lc.includes("42p01") ||
    lc.includes("could not find the table") ||
    // Supabase REST sometimes responds with this when the schema cache hasn't
    // refreshed after a migration:
    lc.includes("schema cache");

  return { isMissingTable: isMissing, rawMessage: raw };
}

/**
 * Run a HEAD probe against every required table. Cheap (~14 selects with
 * count head). Useful for an admin "setup" health screen.
 */
export async function probeRequiredTables(): Promise<MissingTablesReport> {
  if (!isSupabaseConfigured()) {
    return {
      hasMissing: true,
      missing: [...REQUIRED_TABLES],
      errored: [],
      ready: [],
    };
  }

  const sb = getSupabaseAdmin();
  const ready: RequiredTable[] = [];
  const missing: RequiredTable[] = [];
  const errored: { table: RequiredTable; message: string }[] = [];

  await Promise.all(
    REQUIRED_TABLES.map(async (table) => {
      const { error } = await sb
        .from(table)
        .select("*", { count: "exact", head: true })
        .limit(1);

      if (!error) {
        ready.push(table);
        return;
      }
      const hint = classifySupabaseError(error);
      if (hint.isMissingTable) {
        missing.push(table);
      } else {
        errored.push({ table, message: error.message });
      }
    }),
  );

  return {
    hasMissing: missing.length > 0,
    missing: missing.sort(),
    errored,
    ready: ready.sort(),
  };
}

export const REQUIRED_TABLES_LIST = REQUIRED_TABLES;
