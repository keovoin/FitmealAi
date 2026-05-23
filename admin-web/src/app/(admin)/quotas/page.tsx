import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getQuotaSettings } from "@/lib/supabase/quota-settings";
import { QuotasForm } from "./quotas-form";
import { Gauge, Sparkles, Shuffle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuotasAdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Quotas">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const settings = await getQuotaSettings();

  return (
    <PageShell
      title="Quotas"
      subtitle="Daily caps for AI meal-plan generation and catalog shuffles, by tier."
    >
      <GlassCard>
        <div className="flex items-start gap-3">
          <Gauge className="h-6 w-6 flex-shrink-0 text-accent-purple" />
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">
              How this works
            </p>
            <p className="mt-1 text-sm text-white/70">
              Two independent caps per tier. <Sparkles className="inline h-3.5 w-3.5 align-text-bottom text-accent-purple" /> <b className="text-white">AI generations</b> create a brand-new meal plan from the user&apos;s prefs. <Shuffle className="inline h-3.5 w-3.5 align-text-bottom text-accent-blue" /> <b className="text-white">Catalog shuffles</b> pick a published recipe from the curated <code className="rounded bg-white/10 px-1 text-[11px]">recipes</code> table. Both flows respect the user&apos;s diet/allergy/cook-time preferences. Use <code className="rounded bg-white/10 px-1 text-[11px]">-1</code> on a shuffle limit for &ldquo;unlimited&rdquo;.
            </p>
            <p className="mt-2 text-xs text-white/55">
              Stored in <code className="rounded bg-white/10 px-1 text-[10px]">app_settings</code>. The AI rate-limit SQL function <code className="rounded bg-white/10 px-1 text-[10px]">check_ai_rate_limit()</code> reads these on every call.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="mt-3">
        <GlassCard>
          <QuotasForm initial={settings} />
        </GlassCard>
      </div>
    </PageShell>
  );
}
