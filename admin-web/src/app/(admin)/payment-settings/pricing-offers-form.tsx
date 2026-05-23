"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updatePricingOffers } from "@/lib/supabase/admin-actions";
import type {
  Audience,
  PricingOffers,
  TierOffers,
} from "@/lib/supabase/pricing-offers";
import { Check, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

const AUDIENCE_OPTIONS: { value: Audience; label: string; help: string }[] = [
  {
    value: "first_time",
    label: "First-time only",
    help: "Users who never had ANY paid subscription before (recommended).",
  },
  { value: "everyone", label: "Everyone", help: "All users see the offer." },
  {
    value: "by_country",
    label: "By country",
    help: "Only users whose IP-resolved country matches the code below.",
  },
];

type Tier = "silver" | "gold";

const TIER_LABEL: Record<Tier, string> = {
  silver: "Silver — $4.99 / mo",
  gold: "Gold — $9.99 / mo",
};

export function PricingOffersForm({ initial }: { initial: PricingOffers }) {
  const [draft, setDraft] = useState<PricingOffers>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function patch(tier: Tier, fn: (t: TierOffers) => TierOffers) {
    setDraft((prev) => ({ ...prev, [tier]: fn(prev[tier]) }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updatePricingOffers(draft);
      if (result.ok) setSavedAt(Date.now());
      else setError(result.error);
    });
  }

  function reset() {
    setDraft(initial);
    setError(null);
  }

  return (
    <div className="space-y-4">
      {(["silver", "gold"] as const).map((tier) => {
        const t = draft[tier];
        return (
          <div
            key={tier}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            data-testid={`pricing-tier-${tier}`}
          >
            <div className="flex items-center gap-2">
              <Badge tone={tier === "silver" ? "blue" : "gold"}>
                {TIER_LABEL[tier]}
              </Badge>
            </div>

            {/* ---------- Trial ----------------------------------------- */}
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Free trial</p>
                  <p className="text-xs text-white/55">
                    Days of paid-tier access at $0 before the first charge.
                  </p>
                </div>
                <SwitchInput
                  checked={t.trial.enabled}
                  onChange={(b) =>
                    patch(tier, (c) => ({ ...c, trial: { ...c.trial, enabled: b } }))
                  }
                  testId={`pricing-${tier}-trial-enabled`}
                  ariaLabel={`Enable trial for ${tier}`}
                />
              </div>
              {t.trial.enabled && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-white/60">
                    <span>Trial length (days)</span>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={1}
                      value={t.trial.days}
                      onChange={(e) =>
                        patch(tier, (c) => ({
                          ...c,
                          trial: { ...c.trial, days: Math.max(0, Math.trunc(Number(e.target.value) || 0)) },
                        }))
                      }
                      className="glass-input h-9 w-full text-sm"
                      data-testid={`pricing-${tier}-trial-days`}
                    />
                  </label>
                  <label className="space-y-1 text-xs text-white/60">
                    <span>Audience</span>
                    <select
                      value={t.trial.audience}
                      onChange={(e) =>
                        patch(tier, (c) => ({
                          ...c,
                          trial: { ...c.trial, audience: e.target.value as Audience },
                        }))
                      }
                      className="glass-input h-9 w-full text-sm"
                      data-testid={`pricing-${tier}-trial-audience`}
                    >
                      {AUDIENCE_OPTIONS.filter((o) => o.value !== "by_country").map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>

            {/* ---------- Discount ---------------------------------------- */}
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">First-payment discount</p>
                  <p className="text-xs text-white/55">
                    Percent off the first paid month after the trial (or first
                    charge, when no trial is active).
                  </p>
                </div>
                <SwitchInput
                  checked={t.discount.enabled}
                  onChange={(b) =>
                    patch(tier, (c) => ({
                      ...c,
                      discount: { ...c.discount, enabled: b },
                    }))
                  }
                  testId={`pricing-${tier}-discount-enabled`}
                  ariaLabel={`Enable discount for ${tier}`}
                />
              </div>
              {t.discount.enabled && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-white/60">
                    <span>Percent off</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={t.discount.percentOff}
                      onChange={(e) =>
                        patch(tier, (c) => ({
                          ...c,
                          discount: {
                            ...c.discount,
                            percentOff: Math.max(0, Math.min(100, Math.trunc(Number(e.target.value) || 0))),
                          },
                        }))
                      }
                      className="glass-input h-9 w-full text-sm"
                      data-testid={`pricing-${tier}-discount-percent`}
                    />
                  </label>
                  <label className="space-y-1 text-xs text-white/60">
                    <span>Audience</span>
                    <select
                      value={t.discount.audience}
                      onChange={(e) =>
                        patch(tier, (c) => ({
                          ...c,
                          discount: { ...c.discount, audience: e.target.value as Audience },
                        }))
                      }
                      className="glass-input h-9 w-full text-sm"
                      data-testid={`pricing-${tier}-discount-audience`}
                    >
                      {AUDIENCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {t.discount.audience === "by_country" && (
                    <label className="space-y-1 text-xs text-white/60 sm:col-span-2">
                      <span>Country code (ISO-3166-1 alpha-2)</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={t.discount.country}
                        onChange={(e) =>
                          patch(tier, (c) => ({
                            ...c,
                            discount: { ...c.discount, country: e.target.value.toUpperCase() },
                          }))
                        }
                        placeholder="KH"
                        className="glass-input h-9 w-32 text-sm uppercase tracking-wider"
                        data-testid={`pricing-${tier}-discount-country`}
                      />
                    </label>
                  )}
                  <label className="space-y-1 text-xs text-white/60">
                    <span>Starts at (optional)</span>
                    <input
                      type="datetime-local"
                      value={t.discount.startsAt ? toLocalInput(t.discount.startsAt) : ""}
                      onChange={(e) =>
                        patch(tier, (c) => ({
                          ...c,
                          discount: {
                            ...c.discount,
                            startsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                          },
                        }))
                      }
                      className="glass-input h-9 w-full text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-white/60">
                    <span>Ends at (optional)</span>
                    <input
                      type="datetime-local"
                      value={t.discount.endsAt ? toLocalInput(t.discount.endsAt) : ""}
                      onChange={(e) =>
                        patch(tier, (c) => ({
                          ...c,
                          discount: {
                            ...c.discount,
                            endsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                          },
                        }))
                      }
                      className="glass-input h-9 w-full text-sm"
                    />
                  </label>
                </div>
              )}
            </div>

            <Preview tier={tier} offers={t} />
          </div>
        );
      })}

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
        Heads up: trials and discounts displayed here are the source of truth
        for what the mobile paywall shows. The actual price charged on
        StoreKit / Play Billing must also be configured in App Store Connect
        and Google Play Console.
      </div>

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
            variant="primary"
            onClick={save}
            loading={pending}
            disabled={!dirty}
            data-testid="pricing-offers-save-button"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Convert an ISO timestamp to a value `<input type="datetime-local">` accepts. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SwitchInput({
  checked,
  onChange,
  testId,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  testId: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full border transition-colors ${
        checked
          ? "bg-success/40 border-success/60"
          : "bg-white/[0.08] border-white/20"
      }`}
    >
      <span
        className={`absolute top-0.5 inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Preview({ tier, offers }: { tier: Tier; offers: TierOffers }) {
  const monthly = tier === "silver" ? "$4.99" : "$9.99";
  const parts: string[] = [];
  if (offers.trial.enabled && offers.trial.days > 0) {
    parts.push(`${offers.trial.days}-day free trial`);
  }
  if (offers.discount.enabled && offers.discount.percentOff > 0) {
    parts.push(`${offers.discount.percentOff}% off first month`);
  }
  parts.push(`then ${monthly} / mo`);

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/65">
      <span className="text-white/40">Mobile preview:</span>{" "}
      <span className="text-white/85">{parts.join(" → ")}</span>
    </div>
  );
}
