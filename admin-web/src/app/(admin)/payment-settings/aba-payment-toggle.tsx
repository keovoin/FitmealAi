"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateAbaPaymentSettings } from "@/lib/supabase/admin-actions";
import { Check, Plus, X, AlertTriangle } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Renders the ABA payment master switch and the country allow-list.
 *
 * - Toggle: turns the "Pay with ABA" button on/off across both apps.
 * - Region chips: ISO-3166-1 alpha-2 codes (e.g. KH, TH, VN). Empty list
 *   means "available everywhere when enabled" — generally not what we
 *   want, so we surface a warning when the admin clears all regions.
 *
 * The change persists immediately when the admin clicks Save; mobile
 * clients pick it up on their next /api/payments/options poll
 * (typically the next paywall open).
 */
export function AbaPaymentToggle({
  initialEnabled,
  initialAllowedRegions,
}: {
  initialEnabled: boolean;
  initialAllowedRegions: string[];
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [regions, setRegions] = useState<string[]>(
    initialAllowedRegions.map((r) => r.toUpperCase()),
  );
  const [draftRegion, setDraftRegion] = useState("");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    enabled !== initialEnabled ||
    regions.join(",") !== initialAllowedRegions.map((r) => r.toUpperCase()).join(",");

  function addRegion() {
    const cleaned = draftRegion.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cleaned)) {
      setError(`"${draftRegion}" is not a valid ISO-3166-1 alpha-2 code (e.g. KH, TH).`);
      return;
    }
    if (regions.includes(cleaned)) {
      setError(`${cleaned} is already in the list.`);
      return;
    }
    setRegions([...regions, cleaned]);
    setDraftRegion("");
    setError(null);
  }

  function removeRegion(code: string) {
    setRegions(regions.filter((r) => r !== code));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateAbaPaymentSettings({
        enabled,
        allowedRegions: regions,
      });
      if (result.ok) {
        setSavedAt(Date.now());
      } else {
        setError(result.error);
      }
    });
  }

  function reset() {
    setEnabled(initialEnabled);
    setRegions(initialAllowedRegions.map((r) => r.toUpperCase()));
    setDraftRegion("");
    setError(null);
  }

  return (
    <div className="mt-4 space-y-4">
      {/* ----- Master switch ----------------------------------------- */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Enabled</p>
          <p className="text-xs text-white/55">
            Hides the &ldquo;Pay with ABA&rdquo; button in iOS and Android
            paywalls when off.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable manual ABA payments"
          data-testid="aba-payment-enabled-switch"
          onClick={() => setEnabled((v) => !v)}
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

      {/* ----- Region allow list ------------------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Allowed regions</p>
            <p className="text-xs text-white/55">
              ISO-3166-1 alpha-2 country codes. The button only shows when
              the user&apos;s detected country matches one of these. Default:{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                KH
              </code>{" "}
              (Cambodia).
            </p>
          </div>
        </div>

        {regions.length === 0 ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-100">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              No regions selected — when enabled, the ABA button will show
              everywhere. Add at least one country code (e.g. <code>KH</code>)
              to keep it Cambodia-only.
            </span>
          </div>
        ) : (
          <ul
            className="mt-3 flex flex-wrap gap-1.5"
            data-testid="aba-payment-regions-list"
          >
            {regions.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => removeRegion(code)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/[0.14]"
                  aria-label={`Remove ${code}`}
                >
                  <span>{REGION_FLAG[code] ?? "🌐"}</span>
                  <span>{code}</span>
                  <span className="text-white/55">{REGION_NAME[code] ?? ""}</span>
                  <X className="h-3 w-3 text-white/55" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add a new region */}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={draftRegion}
            onChange={(e) => setDraftRegion(e.target.value)}
            placeholder="KH"
            maxLength={2}
            spellCheck={false}
            className="glass-input h-9 w-20 text-xs uppercase tracking-wider"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRegion();
              }
            }}
            data-testid="aba-payment-region-input"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="h-3 w-3" />}
            onClick={addRegion}
            data-testid="aba-payment-add-region-button"
          >
            Add region
          </Button>
          <div className="ml-auto flex items-center gap-1 text-[11px] text-white/45">
            Common: KH, TH, VN, LA, MY, SG
          </div>
        </div>
      </div>

      {/* ----- Save / status ----------------------------------------- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <Badge tone="gold">Unsaved changes</Badge>}
          {savedAt && !dirty && (
            <Badge tone="green">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          )}
          {error && (
            <span className="text-[11px] text-red-300">{error}</span>
          )}
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
            data-testid="aba-payment-save-button"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

const REGION_FLAG: Record<string, string> = {
  KH: "🇰🇭",
  TH: "🇹🇭",
  VN: "🇻🇳",
  LA: "🇱🇦",
  MY: "🇲🇾",
  SG: "🇸🇬",
  ID: "🇮🇩",
  PH: "🇵🇭",
  US: "🇺🇸",
  GB: "🇬🇧",
};

const REGION_NAME: Record<string, string> = {
  KH: "Cambodia",
  TH: "Thailand",
  VN: "Vietnam",
  LA: "Laos",
  MY: "Malaysia",
  SG: "Singapore",
  ID: "Indonesia",
  PH: "Philippines",
  US: "United States",
  GB: "United Kingdom",
};
