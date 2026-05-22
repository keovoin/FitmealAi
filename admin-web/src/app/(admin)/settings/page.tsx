import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { isAIConfigured } from "@/lib/ai/openai";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { MobileConfigPanel } from "./mobile-config-panel";

export default function AdminSettingsPage() {
  const supabaseOn = isSupabaseConfigured();
  const aiOn = isAIConfigured();
  const anonOn = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    <PageShell
      title="Admin settings"
      subtitle="Tools and integrations the admin uses."
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
          <div className="mt-3">
            <Badge tone="purple">Phase-3 stub</Badge>
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
            values. The anon key is public, but the service-role key must stay
            server-only and should never be pasted into Xcode.
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
          <div className="mt-3">
            <Badge tone={supabaseOn ? "green" : "outline"}>
              {supabaseOn ? "Connected" : "Not configured"}
            </Badge>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            AI meal generation
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {aiOn ? "OpenAI connected" : "OpenAI not connected"}
          </p>
          <p className="mt-2 text-sm text-white/65">
            {aiOn
              ? "POST /api/ai/meal-plan generates structured meals, dedupes by title slug, and caches images in the meal-images bucket."
              : "Set OPENAI_API_KEY in Vercel env vars to enable meal generation."}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone={aiOn ? "green" : "outline"}>
              {aiOn ? "Connected" : "Not configured"}
            </Badge>
            <Badge tone="blue">Rate-limited per tier</Badge>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Notifications
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            Push & in-app messages
          </p>
          <p className="mt-2 text-sm text-white/65">
            Coming with the iOS auth wiring. Approval triggers do not yet
            push a notification to the user&apos;s device.
          </p>
          <div className="mt-3">
            <Badge tone="outline">Planned</Badge>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
