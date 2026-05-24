import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { isAIConfigured } from "@/lib/ai/openai";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { MobileConfigPanel } from "./mobile-config-panel";
import { DocLink } from "@/components/ui/doc-link";
import { Banknote, Bell, Stethoscope } from "lucide-react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const supabaseOn = isSupabaseConfigured();
  const aiOn = isAIConfigured();
  const anonOn = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    <PageShell
      title="Admin settings"
      subtitle="Tools and integrations the admin uses."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/payment-settings"
            className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
          >
            <Banknote className="h-3.5 w-3.5" />
            Payment settings
          </Link>
          <Link
            href="/setup"
            className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Setup health check
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">Auth</p>
          <p className="mt-1 text-base font-semibold text-white">
            Single-password gate
          </p>
          <p className="mt-2 text-sm text-white/65">
            Change <code className="rounded bg-white/10 px-1 py-0.5 text-xs">ADMIN_PASSWORD</code>
            {" "}in your environment to rotate. We&apos;ll move this to SSO once
            real admin accounts are needed.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="purple">Phase-3 stub</Badge>
            <DocLink
              href="https://vercel.com/docs/projects/environment-variables"
              label="Vercel env vars"
            />
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-white/50">
            iOS runtime config
          </p>
          <p data-testid="mobile-config-title" className="mt-1 text-base font-semibold text-white">
            Supabase + API placeholders
          </p>
          <p className="mt-2 text-sm text-white/65">
            Use this admin-only helper to insert or replace the iOS Info.plist
            values, including Google placeholders when ready. The anon key is public,
            but the service-role key must stay server-only and should never be pasted into Xcode.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={supabaseOn ? "green" : "outline"}>
              Supabase URL {supabaseOn ? "ready" : "missing"}
            </Badge>
            <Badge tone={anonOn ? "green" : "outline"}>
              Anon key {anonOn ? "ready" : "missing"}
            </Badge>
            <Badge tone={apiBaseUrl ? "green" : "outline"}>
              API URL {apiBaseUrl ? "ready" : "missing"}
            </Badge>
            <Badge tone="outline">Google fields manual</Badge>
            <DocLink
              href="https://app.supabase.com/"
              label="Supabase dashboard"
            />
            <DocLink
              href="https://console.cloud.google.com/apis/credentials"
              label="Google Cloud credentials"
            />
            <DocLink
              href="https://developer.apple.com/documentation/bundleresources/information_property_list"
              label="Info.plist reference"
            />
          </div>
          <MobileConfigPanel
            initialSupabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
            initialAPIBaseUrl={apiBaseUrl}
          />
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Data source
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {supabaseOn ? "Supabase Postgres" : "Mock fixtures"}
          </p>
          <p className="mt-2 text-sm text-white/65">
            {supabaseOn
              ? "All users, payments, and subscriptions read from Supabase via the service role. Approve/reject decisions persist immediately and the user's tier auto-updates."
              : "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars to switch to the live database."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={supabaseOn ? "green" : "outline"}>
              {supabaseOn ? "Connected" : "Not configured"}
            </Badge>
            <DocLink
              href="https://app.supabase.com/project/_/settings/api"
              label="Get Supabase keys"
            />
            <DocLink
              href="https://supabase.com/docs/guides/auth/row-level-security"
              label="RLS docs"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            AI meal generation
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {aiOn ? "AI provider connected" : "AI not connected"}
          </p>
          <p className="mt-2 text-sm text-white/65">
            {aiOn
              ? "POST /api/ai/meal-plan generates structured meals, dedupes by title slug, and caches images in the meal-images bucket. Configure the active provider in AI settings."
              : "Set OPENAI_API_KEY (or KIRO_AI_* / CUSTOM_AI_* env vars) in Vercel to enable meal generation."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={aiOn ? "green" : "outline"}>
              {aiOn ? "Connected" : "Not configured"}
            </Badge>
            <Badge tone="blue">Rate-limited per tier</Badge>
            <Link
              href="/ai-settings"
              className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
            >
              AI provider settings
            </Link>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Payments
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            ABA toggle, KHQR providers, Store billing
          </p>
          <p className="mt-2 text-sm text-white/65">
            Toggle the manual ABA flow on/off, restrict it to specific
            countries (Cambodia by default), and review the configured
            KHQR provider.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/payment-settings"
              className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
            >
              <Banknote className="h-3 w-3" />
              Open payment settings
            </Link>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Notifications
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            Push & Telegram messages
          </p>
          <p className="mt-2 text-sm text-white/65">
            Manage push providers (FCM, APNs), Telegram bot integration,
            and customize notification templates from the dedicated page.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/notifications"
              className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
            >
              <Bell className="h-3 w-3" />
              Open notifications
            </Link>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
