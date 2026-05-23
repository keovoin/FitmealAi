import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_KEY,
  mergeTemplates,
  sanitizeTemplates,
  type NotificationTemplates,
} from "./notification-templates-shared";

// Re-export everything from the shared module so existing imports of
// `notification-templates` keep working server-side. Client code MUST
// import from `notification-templates-shared` instead because this
// file pulls in `server-only` and `getSupabaseAdmin`.
export * from "./notification-templates-shared";

/** Read all templates, falling back to defaults for missing fields. */
export async function getNotificationTemplates(): Promise<NotificationTemplates> {
  if (!isSupabaseConfigured()) return DEFAULT_TEMPLATES;
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("app_settings")
      .select("value")
      .eq("key", TEMPLATE_KEY)
      .maybeSingle();
    if (error || !data?.value) return DEFAULT_TEMPLATES;
    return mergeTemplates(data.value as Partial<NotificationTemplates>);
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

/** Persist a full template map. Service-role only. */
export async function setNotificationTemplates(
  next: NotificationTemplates,
): Promise<void> {
  const sb = getSupabaseAdmin();
  const cleaned = sanitizeTemplates(next);
  const { error } = await sb
    .from("app_settings")
    .upsert(
      [
        {
          key: TEMPLATE_KEY,
          value: cleaned as unknown as object,
          description:
            "Editable text for each push notification type. Surfaced on /notifications.",
        },
      ],
      { onConflict: "key" },
    );
  if (error) throw new Error(error.message);
}
