import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";

/**
 * Admin-editable text for the 6 notification types the mobile app
 * surfaces in `notification_prefs`. Stored as a single JSONB row in
 * `app_settings` under the key `notification_templates`.
 *
 * Bodies may use `{name}`, `{tier}`, `{streak}` placeholders which the
 * delivery routes substitute at send time.
 */

export const TEMPLATE_KEY = "notification_templates" as const;

export const NOTIFICATION_TYPES = [
  "meal_plan_ready",
  "payment_approved",
  "water_reminder",
  "workout_reminder",
  "habit_streak",
  "weekly_summary",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationTemplate {
  title: string;
  body: string;
}

export type NotificationTemplates = Record<NotificationType, NotificationTemplate>;

export const DEFAULT_TEMPLATES: NotificationTemplates = {
  meal_plan_ready: {
    title: "Today's plan is ready",
    body: "Your personalized meal plan is waiting in FitMeal AI.",
  },
  payment_approved: {
    title: "Welcome to FitMeal {tier}",
    body: "Your payment has been approved. Enjoy unlimited generations.",
  },
  water_reminder: {
    title: "Hydration check",
    body: "Time to sip some water. Aim for 8 glasses a day.",
  },
  workout_reminder: {
    title: "Move your body",
    body: "Your workout is scheduled. A short session beats none.",
  },
  habit_streak: {
    title: "{streak}-day streak!",
    body: "You're on a roll, {name}. Keep it going.",
  },
  weekly_summary: {
    title: "Your weekly recap",
    body: "Here's how the past 7 days looked. Open the app for details.",
  },
};

export const TEMPLATE_LABELS: Record<NotificationType, string> = {
  meal_plan_ready: "Meal plan ready",
  payment_approved: "Payment approved",
  water_reminder: "Water reminder",
  workout_reminder: "Workout reminder",
  habit_streak: "Habit streak",
  weekly_summary: "Weekly summary",
};

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
  const cleaned = sanitize(next);
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

function mergeTemplates(raw: Partial<NotificationTemplates>): NotificationTemplates {
  const out = { ...DEFAULT_TEMPLATES };
  for (const key of NOTIFICATION_TYPES) {
    const incoming = raw?.[key] as Partial<NotificationTemplate> | undefined;
    if (incoming && typeof incoming === "object") {
      out[key] = {
        title:
          typeof incoming.title === "string" && incoming.title.trim().length > 0
            ? incoming.title
            : DEFAULT_TEMPLATES[key].title,
        body:
          typeof incoming.body === "string" && incoming.body.trim().length > 0
            ? incoming.body
            : DEFAULT_TEMPLATES[key].body,
      };
    }
  }
  return out;
}

function sanitize(input: NotificationTemplates): NotificationTemplates {
  const out = { ...DEFAULT_TEMPLATES };
  for (const key of NOTIFICATION_TYPES) {
    const t = input[key] ?? DEFAULT_TEMPLATES[key];
    out[key] = {
      title: (t.title ?? "").trim().slice(0, 120) || DEFAULT_TEMPLATES[key].title,
      body: (t.body ?? "").trim().slice(0, 500) || DEFAULT_TEMPLATES[key].body,
    };
  }
  return out;
}

/**
 * Substitute `{name}`, `{tier}`, `{streak}` placeholders. Used by the
 * /api/push/send and /api/telegram/send routes when delivering.
 */
export function renderTemplate(
  template: NotificationTemplate,
  vars: Record<string, string | number | undefined>,
): NotificationTemplate {
  return {
    title: substitute(template.title, vars),
    body: substitute(template.body, vars),
  };
}

function substitute(
  s: string,
  vars: Record<string, string | number | undefined>,
): string {
  return s.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? `{${key}}` : String(v);
  });
}
