"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateTelegramSettings } from "@/lib/supabase/admin-actions";
import type { TelegramSettings } from "@/lib/supabase/telegram-settings";
import { Check } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Admin-side controls for the Telegram bot integration. Mirrors the
 * ABA payment toggle:
 *  - Master enable/disable switch (hides the mobile Link Telegram
 *    button when off).
 *  - Bot @username text field (stripped of any leading `@`).
 *
 * The `TELEGRAM_BOT_TOKEN` env var is still required for messages to
 * actually deliver -- this panel only controls the user-facing parts
 * that are safe to flip from the admin UI.
 */
export function TelegramSettingsPanel({
  initial,
  tokenConfigured,
}: {
  initial: TelegramSettings;
  tokenConfigured: boolean;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [botUsername, setBotUsername] = useState(initial.botUsername);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanedUsername = botUsername.trim().replace(/^@/, "");
  const dirty =
    enabled !== initial.enabled ||
    cleanedUsername !== initial.botUsername.trim().replace(/^@/, "");

  const usernameValid = /^[A-Za-z0-9_]{0,64}$/.test(cleanedUsername);
  const canEnable = !enabled || cleanedUsername.length >= 5;

  function save() {
    setError(null);
    if (!usernameValid) {
      setError(
        "Username may only contain letters, numbers, and underscores (Telegram rules).",
      );
      return;
    }
    if (enabled && cleanedUsername.length < 5) {
      setError("Set a bot @username before enabling Telegram.");
      return;
    }
    startTransition(async () => {
      const result = await updateTelegramSettings({
        enabled,
        botUsername: cleanedUsername,
      });
      if (result.ok) {
        setSavedAt(Date.now());
      } else {
        setError(result.error);
      }
    });
  }

  function reset() {
    setEnabled(initial.enabled);
    setBotUsername(initial.botUsername);
    setError(null);
  }

  return (
    <div className="mt-4 space-y-4">
      {/* ---------- Master switch ----------------------------------- */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            Enable Telegram bot
          </p>
          <p className="text-xs text-white/55">
            When off, the mobile{" "}
            <span className="font-medium text-white/75">Link Telegram</span>{" "}
            button is hidden in Settings &rarr; Notifications.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable Telegram bot integration"
          data-testid="telegram-enabled-switch"
          onClick={() => setEnabled((v) => !v)}
          disabled={!canEnable && !enabled}
          className={`relative h-7 w-12 rounded-full border transition-colors ${
            enabled
              ? "bg-success/40 border-success/60"
              : "bg-white/[0.08] border-white/20"
          }`}
        >
          <span
            className={`absolute top-0.5 inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* ---------- Bot username ------------------------------------ */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <label className="block">
          <p className="text-sm font-medium text-white">Bot @username</p>
          <p className="mt-0.5 text-xs text-white/55">
            From{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-accent-blue hover:underline"
            >
              @BotFather
            </a>
            . Just the username -- no leading @, no t.me/. Telegram
            usernames are letters, numbers, and underscores only.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="select-none text-sm text-white/45">@</span>
            <input
              data-testid="telegram-bot-username-input"
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
              placeholder="fitmeal_ai_bot"
              maxLength={64}
              spellCheck={false}
              autoComplete="off"
              className="glass-input h-9 flex-1 text-sm"
            />
          </div>
          {cleanedUsername && (
            <p className="mt-2 text-[11px] text-white/50">
              Deep link preview:{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-white/80">
                https://t.me/{cleanedUsername}?start=&#123;user_id&#125;
              </code>
            </p>
          )}
        </label>
      </div>

      {/* ---------- Setup hint -------------------------------------- */}
      {!tokenConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
          Telegram <code>BOT_TOKEN</code> is not configured in the Vercel
          env. Toggling enabled here will surface the link button to
          users, but messages from{" "}
          <code>/api/telegram/send</code> will not deliver until the
          token is set.
        </div>
      )}

      {/* ---------- Save / status ----------------------------------- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <Badge tone="gold">Unsaved changes</Badge>}
          {savedAt && !dirty && (
            <Badge tone="green">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          )}
          {error && <span className="text-[11px] text-red-300">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={reset}
              disabled={pending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant={enabled ? "success" : "primary"}
            onClick={save}
            loading={pending}
            disabled={!dirty}
            data-testid="telegram-save-button"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
