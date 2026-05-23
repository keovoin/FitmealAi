import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";

/**
 * Admin-controlled Telegram bot configuration. Mirrors the ABA payment
 * pattern in `app-settings.ts`: stored as JSONB rows in `app_settings`
 * so admins can flip the toggle and rotate the bot username without a
 * redeploy.
 *
 * Storage shape:
 *   key                       | value
 *   --------------------------+--------------
 *   telegram.enabled          | true | false
 *   telegram.bot_username     | "fitmeal_ai_bot"
 *
 * The `TELEGRAM_BOT_TOKEN` env var is still required for the bot to
 * actually send messages -- the toggle here just controls whether the
 * mobile "Link Telegram" button is offered to users.
 */

export const TELEGRAM_KEYS = {
  enabled: "telegram.enabled",
  botUsername: "telegram.bot_username",
} as const;

export interface TelegramSettings {
  enabled: boolean;
  /** Bot @username without the leading `@`. Empty when not yet configured. */
  botUsername: string;
}

const DEFAULT_TELEGRAM: TelegramSettings = {
  enabled: false,
  botUsername: "",
};

/**
 * Read current Telegram admin settings. Always returns a valid object
 * so the admin UI keeps rendering even when the migration hasn't been
 * applied or no row has been seeded yet.
 */
export async function getTelegramSettings(): Promise<TelegramSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_TELEGRAM;
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("app_settings")
      .select("key,value")
      .in("key", [TELEGRAM_KEYS.enabled, TELEGRAM_KEYS.botUsername]);
    if (error || !data) return DEFAULT_TELEGRAM;

    const enabledRow = data.find((r) => r.key === TELEGRAM_KEYS.enabled);
    const usernameRow = data.find((r) => r.key === TELEGRAM_KEYS.botUsername);

    return {
      enabled:
        typeof enabledRow?.value === "boolean"
          ? enabledRow.value
          : DEFAULT_TELEGRAM.enabled,
      botUsername:
        typeof usernameRow?.value === "string"
          ? usernameRow.value
          : DEFAULT_TELEGRAM.botUsername,
    };
  } catch {
    return DEFAULT_TELEGRAM;
  }
}

/**
 * Persist a new set of Telegram admin settings. Service-role only.
 * Sanitizes the username (strips a leading `@`, trims, length-caps)
 * to avoid cluttering the t.me deep link.
 */
export async function setTelegramSettings(
  value: TelegramSettings,
): Promise<void> {
  const sb = getSupabaseAdmin();
  const cleanUsername = value.botUsername.trim().replace(/^@/, "").slice(0, 64);

  const rows = [
    {
      key: TELEGRAM_KEYS.enabled,
      value: Boolean(value.enabled) as unknown,
      description:
        "Master switch for the Telegram bot integration. When off, the mobile Link Telegram button is hidden.",
    },
    {
      key: TELEGRAM_KEYS.botUsername,
      value: cleanUsername as unknown,
      description:
        "Telegram bot @username (without leading @). Used to build the https://t.me/{bot}?start={user_id} deep link.",
    },
  ];

  const { error } = await sb
    .from("app_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
