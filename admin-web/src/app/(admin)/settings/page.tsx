import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function AdminSettingsPage() {
  const supabaseOn = isSupabaseConfigured();
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

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Content library
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            Meals, exercises, habits
          </p>
          <p className="mt-2 text-sm text-white/65">
            Curated templates the AI can pull from. Phase-4b adds the AI
            meal-plan endpoint that fills the shared meals pool.
          </p>
          <div className="mt-3">
            <Badge tone="outline">Phase 4b</Badge>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
