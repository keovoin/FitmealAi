import { Badge } from "@/components/ui/badge";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { DocLink } from "@/components/ui/doc-link";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getNotificationTemplates } from "@/lib/supabase/notification-templates";
import { NotificationTemplatesEditor } from "./templates-editor";
import {
  Bell,
  Check,
  MessageCircle,
  Send,
  Smartphone,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProviderStatus {
  name: string;
  envVar: string;
  ok: boolean;
  description: string;
  doc: { href: string; label: string };
  icon: LucideIcon;
  required?: boolean;
}

export default async function NotificationsAdminPage() {
  // Provider env presence is checked server-side. We never echo the
  // actual values back to the page, only booleans.
  const fcmOk = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const apnsKeyId = !!process.env.APNS_KEY_ID;
  const apnsTeamId = !!process.env.APNS_TEAM_ID;
  const apnsP8 = !!process.env.APNS_KEY_P8;
  const telegramOk = !!process.env.TELEGRAM_BOT_TOKEN;

  const providers: ProviderStatus[] = [
    {
      name: "Firebase Cloud Messaging (Android)",
      envVar: "FIREBASE_SERVICE_ACCOUNT_JSON",
      ok: fcmOk,
      description:
        "Service-account JSON used by /api/push/send to deliver to Android devices.",
      doc: {
        href: "https://console.firebase.google.com/",
        label: "Firebase Console",
      },
      icon: Smartphone,
      required: true,
    },
    {
      name: "APNs Key ID (iOS)",
      envVar: "APNS_KEY_ID",
      ok: apnsKeyId,
      description: "Key ID from your APNs auth key (.p8 file).",
      doc: {
        href: "https://developer.apple.com/account/resources/authkeys/list",
        label: "Apple Developer keys",
      },
      icon: Smartphone,
    },
    {
      name: "APNs Team ID (iOS)",
      envVar: "APNS_TEAM_ID",
      ok: apnsTeamId,
      description: "Your Apple Developer team identifier.",
      doc: {
        href: "https://developer.apple.com/account",
        label: "Apple Developer membership",
      },
      icon: Smartphone,
    },
    {
      name: "APNs .p8 key (iOS)",
      envVar: "APNS_KEY_P8",
      ok: apnsP8,
      description:
        "Contents of the AuthKey_*.p8 file (PEM, including BEGIN/END lines).",
      doc: {
        href: "https://developer.apple.com/documentation/usernotifications/establishing_a_token-based_connection_to_apns",
        label: "APNs token-based auth",
      },
      icon: Smartphone,
    },
    {
      name: "Telegram bot token",
      envVar: "TELEGRAM_BOT_TOKEN",
      ok: telegramOk,
      description:
        "Bot token issued by @BotFather. Used by /api/telegram/send and the webhook.",
      doc: {
        href: "https://t.me/BotFather",
        label: "@BotFather",
      },
      icon: MessageCircle,
    },
  ];

  const allRequiredOk = providers.every((p) => !p.required || p.ok);

  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Notifications">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const templates = await getNotificationTemplates();

  return (
    <PageShell
      title="Notifications"
      subtitle="Push providers, templates, and delivery health."
    >
      {/* Provider status -------------------------------------------------- */}
      <GlassCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">
              Delivery providers
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              Push + Telegram environment variables
            </p>
            <p className="mt-1 text-sm text-white/60">
              Each row reflects whether the corresponding env var is set on
              this Vercel deployment. Values are not displayed for security.
            </p>
          </div>
          <Badge tone={allRequiredOk ? "green" : "gold"}>
            {allRequiredOk ? "Ready" : "Action needed"}
          </Badge>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {providers.map((p) => (
            <li
              key={p.envVar}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                p.ok
                  ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                  : p.required
                    ? "border-red-500/40 bg-red-500/[0.06]"
                    : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  p.ok
                    ? "bg-emerald-500/30 text-emerald-100"
                    : p.required
                      ? "bg-red-500/30 text-red-100"
                      : "bg-white/10 text-white/70"
                }`}
              >
                {p.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p.icon className="h-3.5 w-3.5 text-white/60" />
                  <p className="truncate text-sm font-semibold text-white">
                    {p.name}
                  </p>
                  {p.required && !p.ok && (
                    <span className="text-[10px] uppercase tracking-wider text-red-300">
                      Required
                    </span>
                  )}
                </div>
                <code className="mt-0.5 block break-all text-[11px] text-white/55">
                  {p.envVar}
                </code>
                <p className="mt-1 text-xs text-white/65">{p.description}</p>
                <div className="mt-2">
                  <DocLink href={p.doc.href} label={p.doc.label} inline />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* Template editor -------------------------------------------------- */}
      <div className="mt-3">
        <GlassCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Message templates
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                Notification text per type
              </p>
              <p className="mt-1 text-sm text-white/60">
                Customize what users see for each notification. Use{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  {`{name}`}
                </code>
                ,{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  {`{tier}`}
                </code>
                , and{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  {`{streak}`}
                </code>{" "}
                placeholders. Saved values land in{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  app_settings.notification_templates
                </code>
                .
              </p>
            </div>
            <Bell className="h-6 w-6 flex-shrink-0 text-accent-purple" />
          </div>

          <NotificationTemplatesEditor initial={templates} />
        </GlassCard>
      </div>

      {/* How sending works ----------------------------------------------- */}
      <div className="mt-3">
        <GlassCard>
          <div className="flex items-start gap-3">
            <Send className="h-5 w-5 flex-shrink-0 text-accent-blue" />
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                How delivery works
              </p>
              <p className="mt-1 text-sm text-white/70">
                Mobile clients call{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  POST /api/push/register
                </code>{" "}
                with their FCM/APNs token after sign-in. Server-side jobs call{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  POST /api/push/send
                </code>{" "}
                which looks up tokens, checks{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  notification_prefs
                </code>
                , and renders the matching template. Telegram users connected
                via{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  /start &lt;user_id&gt;
                </code>{" "}
                receive copies through{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  POST /api/telegram/send
                </code>
                .
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
