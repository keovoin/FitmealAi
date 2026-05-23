"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProviderEnvStatus } from "@/lib/ai/openai";
import { updateAIProviderSettings } from "@/lib/supabase/admin-actions";
import {
  type AIProviderId,
  type AIProviderSettings,
} from "@/lib/supabase/ai-provider-shared";
import {
  AlertTriangle,
  Check,
  Cloud,
  ImageIcon,
  KeyRound,
  Link2,
  Server,
  Sparkles,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Radio-style picker between OpenAI and a custom OpenAI-compatible
 * endpoint. The "Active" highlight is driven by `draft.active` so
 * the operator can preview the env-var checklist for either
 * provider before clicking Save.
 *
 * Everything sensitive (API keys, base URL) stays server-side; we
 * only render boolean "set / not set" checkmarks here.
 */
export function AIProviderForm({
  initial,
  envStatus,
}: {
  initial: AIProviderSettings;
  envStatus: ProviderEnvStatus;
}) {
  const [draft, setDraft] = useState<AIProviderSettings>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = draft.active !== initial.active;

  function pick(active: AIProviderId) {
    setDraft({ active });
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateAIProviderSettings(draft);
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

  const customReady =
    envStatus.custom.hasBaseUrl && envStatus.custom.hasApiKey;
  const openaiReady = envStatus.openai.hasApiKey;
  const draftIsValid =
    (draft.active === "openai" && openaiReady) ||
    (draft.active === "custom" && customReady);

  return (
    <div className="space-y-4">
      <ProviderCard
        id="openai"
        title="OpenAI cloud"
        subtitle="Hosted at api.openai.com — bills the OPENAI_API_KEY account."
        active={draft.active === "openai"}
        onSelect={() => pick("openai")}
        icon={<Cloud className="h-5 w-5" />}
      >
        <EnvRow
          icon={<KeyRound className="h-3 w-3" />}
          label="OPENAI_API_KEY"
          set={envStatus.openai.hasApiKey}
        />
        <p className="mt-1 text-[11px] text-white/45">
          Optional model overrides:{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[10px]">
            OPENAI_TEXT_MODEL
          </code>{" "}
          (default <i>gpt-4.1</i>; set to <i>gpt-4.1-mini</i> to cut
          spend ~5x),{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[10px]">
            OPENAI_IMAGE_MODEL
          </code>{" "}
          (default <i>gpt-image-1</i>).
        </p>
      </ProviderCard>

      <ProviderCard
        id="custom"
        title="Custom OpenAI-compatible endpoint"
        subtitle="Self-hosted vLLM / Anyscale / Together / Ollama / your own build. Must speak the OpenAI chat-completions wire format."
        active={draft.active === "custom"}
        onSelect={() => pick("custom")}
        icon={<Server className="h-5 w-5" />}
      >
        <EnvRow
          icon={<Link2 className="h-3 w-3" />}
          label="CUSTOM_AI_BASE_URL"
          set={envStatus.custom.hasBaseUrl}
          hint="e.g. https://my-llm.example.com/v1"
        />
        <EnvRow
          icon={<KeyRound className="h-3 w-3" />}
          label="CUSTOM_AI_API_KEY"
          set={envStatus.custom.hasApiKey}
        />
        <EnvRow
          icon={<Sparkles className="h-3 w-3" />}
          label="CUSTOM_AI_TEXT_MODEL"
          set={envStatus.custom.hasTextModel}
          hint="Optional. Sent verbatim as the `model` field. Defaults to `default` if unset."
        />
        <EnvRow
          icon={<ImageIcon className="h-3 w-3" />}
          label="CUSTOM_AI_IMAGE_MODEL"
          set={envStatus.custom.hasImageModel}
          hint="Optional. Leave blank if your endpoint has no images route — generation will gracefully skip."
        />
      </ProviderCard>

      {/* Footer ----------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <Badge tone="gold">Unsaved selection</Badge>}
          {!dirty && savedAt && (
            <Badge tone="green">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          )}
          {!dirty && !savedAt && (
            <Badge tone="outline">
              Active: {initial.active === "custom" ? "Custom" : "OpenAI"}
            </Badge>
          )}
          {!draftIsValid && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {draft.active === "custom"
                ? "Add CUSTOM_AI_BASE_URL + CUSTOM_AI_API_KEY on Vercel before activating Custom."
                : "Add OPENAI_API_KEY on Vercel before activating OpenAI."}
            </span>
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
            disabled={!dirty || !draftIsValid}
            data-testid="ai-provider-save-button"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProviderCard({
  id,
  title,
  subtitle,
  active,
  onSelect,
  icon,
  children,
}: {
  id: AIProviderId;
  title: string;
  subtitle: string;
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`ai-provider-card-${id}`}
      className={`block w-full rounded-xl border p-4 text-left transition-colors ${
        active
          ? "border-accent-purple/50 bg-accent-purple/[0.08]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white ${
            active ? "bg-accent-purple/40" : "bg-white/[0.08]"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{title}</p>
            {active && (
              <Badge tone="purple">
                <Check className="h-3 w-3" /> Selected
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/60">{subtitle}</p>
          <div className="mt-2 space-y-1">{children}</div>
        </div>
      </div>
    </button>
  );
}

function EnvRow({
  icon,
  label,
  set,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  set: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-4 w-4 items-center justify-center text-white/55">
          {icon}
        </span>
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/85">
          {label}
        </code>
        {set ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
            <Check className="h-3 w-3" /> set
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-white/45">
            <X className="h-3 w-3" /> not set
          </span>
        )}
      </div>
      {hint && (
        <p className="ml-6 text-[11px] text-white/45">{hint}</p>
      )}
    </div>
  );
}
