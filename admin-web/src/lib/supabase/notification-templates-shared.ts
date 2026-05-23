/**
 * Shared, isomorphic constants and types for the notification template
 * system. Safe to import from BOTH client components (the templates
 * editor) and server code (admin actions, API routes).
 *
 * The DB helpers live in `notification-templates.ts` which is marked
 * `server-only` and pulls in `getSupabaseAdmin`. That file re-exports
 * the constants below so existing server-side imports keep working
 * unchanged.
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

export function mergeTemplates(
  raw: Partial<NotificationTemplates> | null | undefined,
): NotificationTemplates {
  const out = { ...DEFAULT_TEMPLATES };
  if (!raw || typeof raw !== "object") return out;
  for (const key of NOTIFICATION_TYPES) {
    const incoming = (raw as Partial<NotificationTemplates>)[key];
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

export function sanitizeTemplates(
  input: NotificationTemplates,
): NotificationTemplates {
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
