import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";

/**
 * Defines the keys we care about in `public.app_settings`. Each helper
 * here resolves to a typed value with a sensible fallback so the UI
 * keeps rendering even when the migration hasn't been applied yet
 * (the catch-all returns the default).
 *
 * Storage shape (jsonb):
 *   key                              | value
 *   ---------------------------------+--------------------
 *   aba_payment.enabled              | true | false
 *   aba_payment.allowed_regions      | ["KH"] | ["KH","TH",...]
 */

export const ABA_KEYS = {
  enabled: "aba_payment.enabled",
  allowedRegions: "aba_payment.allowed_regions",
} as const;

export interface AbaPaymentSettings {
  enabled: boolean;
  /**
   * ISO-3166-1 alpha-2 codes (uppercase). Empty array = available
   * everywhere when enabled. Defaults to ["KH"].
   */
  allowedRegions: string[];
}

const DEFAULT_ABA: AbaPaymentSettings = {
  enabled: true,
  allowedRegions: ["KH"],
};

/**
 * Read the current ABA settings. Always returns a valid object even
 * when the table is missing or the rows haven't been seeded — the
 * defaults match the seed in 0013_app_settings.sql.
 */
export async function getAbaPaymentSettings(): Promise<AbaPaymentSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_ABA;
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("app_settings")
      .select("key,value")
      .in("key", [ABA_KEYS.enabled, ABA_KEYS.allowedRegions]);
    if (error || !data) return DEFAULT_ABA;

    const enabledRow = data.find((r) => r.key === ABA_KEYS.enabled);
    const regionsRow = data.find((r) => r.key === ABA_KEYS.allowedRegions);

    return {
      enabled: typeof enabledRow?.value === "boolean" ? enabledRow.value : DEFAULT_ABA.enabled,
      allowedRegions: Array.isArray(regionsRow?.value)
        ? (regionsRow.value as unknown[])
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.toUpperCase())
        : DEFAULT_ABA.allowedRegions,
    };
  } catch {
    return DEFAULT_ABA;
  }
}

/**
 * Persist a new set of ABA settings. Service-role only.
 */
export async function setAbaPaymentSettings(value: AbaPaymentSettings): Promise<void> {
  const sb = getSupabaseAdmin();
  const cleanRegions = Array.from(
    new Set(
      value.allowedRegions
        .map((r) => r.trim().toUpperCase())
        .filter((r) => /^[A-Z]{2}$/.test(r)),
    ),
  );

  const rows = [
    {
      key: ABA_KEYS.enabled,
      value: Boolean(value.enabled) as unknown,
      description: "Master switch for the manual ABA bank-transfer payment flow.",
    },
    {
      key: ABA_KEYS.allowedRegions,
      value: cleanRegions as unknown,
      description:
        "ISO-3166-1 alpha-2 country codes where the ABA payment button is shown.",
    },
  ];

  const { error } = await sb
    .from("app_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

/**
 * Mobile-side resolver: given the user's detected country code, decide
 * whether the ABA button should be visible. Empty country = "unknown"
 * → fall back to "available everywhere if enabled, else hide" so we
 * don't strand users behind a broken IP-detection chain.
 */
export function isAbaAvailableForRegion(
  settings: AbaPaymentSettings,
  countryCode: string | null | undefined,
): boolean {
  if (!settings.enabled) return false;
  if (settings.allowedRegions.length === 0) return true;
  const cc = (countryCode ?? "").trim().toUpperCase();
  if (!cc) return false;
  return settings.allowedRegions.includes(cc);
}
