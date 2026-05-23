"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateNotificationTemplates } from "@/lib/supabase/admin-actions";
import {
  DEFAULT_TEMPLATES,
  NOTIFICATION_TYPES,
  TEMPLATE_LABELS,
  type NotificationTemplate,
  type NotificationTemplates,
  type NotificationType,
} from "@/lib/supabase/notification-templates";
import { Check, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

export function NotificationTemplatesEditor({
  initial,
}: {
  initial: NotificationTemplates;
}) {
  const [draft, setDraft] = useState<NotificationTemplates>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function update(type: NotificationType, field: keyof NotificationTemplate, value: string) {
    setDraft((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  }

  function resetType(type: NotificationType) {
    setDraft((prev) => ({ ...prev, [type]: DEFAULT_TEMPLATES[type] }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateNotificationTemplates(draft);
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
    <div className="mt-4 space-y-3">
      {NOTIFICATION_TYPES.map((type) => {
        const t = draft[type];
        const isCustomized =
          JSON.stringify(t) !== JSON.stringify(DEFAULT_TEMPLATES[type]);
        return (
          <div
            key={type}
            data-testid={`template-card-${type}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  {TEMPLATE_LABELS[type]}
                </p>
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/55">
                  {type}
                </code>
                {isCustomized && (
                  <span data-testid={`template-customized-${type}`}>
                    <Badge tone="purple">Custom</Badge>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => resetType(type)}
                disabled={!isCustomized}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/55 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={`Reset ${TEMPLATE_LABELS[type]} to default`}
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="space-y-1 text-xs text-white/60">
                <span>Title</span>
                <input
                  data-testid={`template-${type}-title`}
                  value={t.title}
                  onChange={(e) => update(type, "title", e.target.value)}
                  maxLength={120}
                  className="glass-input h-9 text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-white/60">
                <span>Body</span>
                <textarea
                  data-testid={`template-${type}-body`}
                  value={t.body}
                  onChange={(e) => update(type, "body", e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="glass-input min-h-[60px] py-2 text-sm leading-relaxed"
                />
              </label>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3">
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
            data-testid="templates-save-button"
          >
            Save templates
          </Button>
        </div>
      </div>
    </div>
  );
}
