import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminSettingsPage() {
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
            {" "}in your environment to rotate. We&apos;ll move this to SSO with the
            backend.
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
            Mock data files
          </p>
          <p className="mt-2 text-sm text-white/65">
            All users, payments, and subscriptions come from{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
              src/data/mock-*.ts
            </code>
            . The data shape mirrors the iOS app so the future backend can
            serve both.
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Notifications
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            Push & in-app messages
          </p>
          <p className="mt-2 text-sm text-white/65">
            Coming after the backend lands. For now, payment approvals don&apos;t
            actually notify the user.
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
            Curated templates the AI can pull from. Phase-5 work, scoped after
            the backend is in place.
          </p>
          <div className="mt-3">
            <Badge tone="outline">Planned</Badge>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
