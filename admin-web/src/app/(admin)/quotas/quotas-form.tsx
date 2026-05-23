"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateQuotaSettings } from "@/lib/supabase/admin-actions";
import {
  formatQuota,
  type QuotaSettings,
} from "@/lib/supabase/quota-settings-shared";
import { Check, Sparkles, Shuffle } from "lucide-react";
import { useState, useTransition } from "react";

type Tier = "free" | "silver" | "gold";

const TIER_META: Record<
  Tier,
  { label: string; tone: "neutral" | "blue" | "gold"; subtitle: string }
> = {
  free: { label: "Free", tone: "neutral", subtitle: "Default for unauthenticated and unpaid users" },
  silver: { label: "Silver", tone: "blue", subtitle: "$4.99 / mo tier" },
  gold: { label: "Gold", tone: "gold", subtitle: "$9.99 / mo tier (full access)" },
};

export function QuotasForm({ initial }: { initial: QuotaSettings }) {
  const [draft, setDraft] = useState<QuotaSettings>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function setTierField(
    tier: Tier,
    field: "aiPerDay" | "shufflesPerDay",
    raw: string,
  ) {
    const n = raw.trim() === "" ? 0 : Number(raw);
    if (!Number.isFinite(n)) return;
    setDraft((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: Math.trunc(n) },
    }));
  }

  function setMeta(field: "shuffleMealCount" | "catalogMinPublishedPerMealType", raw: string) {
    const n = raw.trim() === "" ? 0 : Number(raw);
    if (!Number.isFinite(n)) return;
    setDraft((prev) => ({ ...prev, [field]: Math.trunc(n) }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateQuotaSettings(draft);
      if (result.ok) {
        setSavedAt(Date.now());
      } else {
        setError(result.error);
      }
    });
  }

  function reset() {
    setDraft(initial);
    setError(null);
  }

  return (
    <div className="space-y-4">
      {(["free", "silver", "gold"] as const).map((tier) => {
        const meta = TIER_META[tier];
        const v = draft[tier];
        return (
          <div
            key={tier}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            data-testid={`quota-row-${tier}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <p className="text-xs text-white/55">{meta.subtitle}</p>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent-purple" />
                  AI generations / day
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={v.aiPerDay}
                  onChange={(e) => setTierField(tier, "aiPerDay", e.target.value)}
                  data-testid={`quota-${tier}-ai`}
                  className="glass-input h-9 w-full text-sm"
                />
                <span className="block text-[11px] text-white/45">
                  {formatQuota(v.aiPerDay)}
                </span>
              </label>
              <label className="space-y-1 text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <Shuffle className="h-3.5 w-3.5 text-accent-blue" />
                  Shuffles / day
                </span>
                <input
                  type="number"
                  min={-1}
                  step={1}
                  value={v.shufflesPerDay}
                  onChange={(e) => setTierField(tier, "shufflesPerDay", e.target.value)}
                  data-testid={`quota-${tier}-shuffle`}
                  className="glass-input h-9 w-full text-sm"
                />
                <span className="block text-[11px] text-white/45">
                  {formatQuota(v.shufflesPerDay)} ({"-1 = unlimited"})
                </span>
              </label>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-white">Catalog defaults</p>
        <p className="mt-0.5 text-xs text-white/55">
          Cross-tier knobs that affect the shuffle response shape.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-white/60">
            <span>Recipes returned per shuffle</span>
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={draft.shuffleMealCount}
              onChange={(e) => setMeta("shuffleMealCount", e.target.value)}
              data-testid="quota-shuffle-count"
              className="glass-input h-9 w-full text-sm"
            />
            <span className="block text-[11px] text-white/45">
              How many alternatives the mobile shuffle button returns at a time.
            </span>
          </label>
          <label className="space-y-1 text-xs text-white/60">
            <span>Catalog minimum (per meal_type) to enable Shuffle</span>
            <input
              type="number"
              min={0}
              step={1}
              value={draft.catalogMinPublishedPerMealType}
              onChange={(e) =>
                setMeta("catalogMinPublishedPerMealType", e.target.value)
              }
              data-testid="quota-catalog-min"
              className="glass-input h-9 w-full text-sm"
            />
            <span className="block text-[11px] text-white/45">
              Mobile Shuffle button stays hidden until this many published recipes
              exist for the user&apos;s requested meal type.
            </span>
          </label>
        </div>
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
            data-testid="quotas-save-button"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
