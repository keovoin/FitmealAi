import { GlassCard } from "@/components/ui/glass-card";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { SetupRequiredBanner } from "@/components/ui/setup-required-banner";
import { PageShell } from "@/components/layout/page-shell";
import { StatTile } from "@/components/ui/stat-tile";
import { TierBadge } from "@/components/domain/tier-badge";
import { PaymentStatusBadge } from "@/components/domain/payment-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  getDashboardSnapshotFromDb,
  getMrrHistory,
  listPayments,
  type MrrDataPoint,
} from "@/lib/supabase/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { classifySupabaseError } from "@/lib/supabase/setup-check";
import { relativeFromNow } from "@/lib/format";
import { AlertTriangle, ArrowRight, CreditCard, TrendingUp, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { SignupsChart } from "./signups-chart";
import { RevenueChart } from "./revenue-chart";
import { DashboardRegenerateTool } from "./dashboard-regenerate-tool";

// Always render fresh; never cache the dashboard since it shows live counters.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Dashboard" subtitle="An overview of FitMeal AI today">
        <ConfigureSupabaseBanner />
        <div className="mt-4">
          <GlassCard>
            <p className="text-xs uppercase tracking-wider text-white/50">
              Support tool
            </p>
            <p data-testid="dashboard-regenerate-title" className="text-base font-semibold text-white">
              Regenerate a user&apos;s meal plan
            </p>
            <p className="mt-1 text-sm text-white/60">
              This tool appears here for setup validation. It becomes usable after Supabase and AI envs are configured.
            </p>
            <DashboardRegenerateTool />
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  let snapshot;
  let recentPayments: Awaited<ReturnType<typeof listPayments>> = [];
  let mrrHistory: MrrDataPoint[] = [];

  try {
    const [snapshotRes, allPayments, mrrHistoryRes] = await Promise.all([
      getDashboardSnapshotFromDb(),
      listPayments(),
      getMrrHistory(8),
    ]);
    snapshot = snapshotRes;
    mrrHistory = mrrHistoryRes;
    recentPayments = allPayments
      .filter((p) => p.status === "pending")
      .slice(0, 4);
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    const hint = classifySupabaseError(error);

    return (
      <PageShell title="Dashboard" subtitle="An overview of FitMeal AI today">
        {hint.isMissingTable ? (
          <SetupRequiredBanner
            page="The dashboard"
            rawMessage={hint.rawMessage}
          />
        ) : (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Unable to load dashboard data</p>
                <p className="mt-1 text-sm opacity-80">
                  Supabase responded with an error. Check that the service-role
                  key is set correctly in Vercel and that the database is
                  reachable.
                </p>
                <p className="mt-2 font-mono text-xs opacity-70 break-all">
                  {hint.rawMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4">
          <GlassCard>
            <p className="text-xs uppercase tracking-wider text-white/50">
              Support tool
            </p>
            <p className="text-base font-semibold text-white">
              Regenerate a user&apos;s meal plan
            </p>
            <p className="mt-1 text-sm text-white/60">
              This tool becomes usable once Supabase migrations are applied.
            </p>
            <DashboardRegenerateTool />
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Dashboard" subtitle="An overview of FitMeal AI today">
      {/* Stat row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Users}
          label="Total users"
          value={snapshot.totalUsers}
          delta={`+${snapshot.newUsersThisWeek} this week`}
          tone="blue"
        />
        <StatTile
          icon={CreditCard}
          label="Active subs"
          value={snapshot.activeSubs}
          delta="StoreKit + ABA"
          tone="purple"
        />
        <StatTile
          icon={Wallet}
          label="Pending payments"
          value={snapshot.pendingPayments}
          delta="Needs review"
          tone="gold"
        />
        <StatTile
          icon={TrendingUp}
          label="MRR"
          value={snapshot.mrr}
          delta="Monthly recurring"
          tone="green"
        />
      </div>

      <div className="mt-4">
        <GlassCard>
          <div className="flex items-start gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Support tool
              </p>
              <p data-testid="dashboard-regenerate-title" className="text-base font-semibold text-white">
                Regenerate a user&apos;s meal plan
              </p>
              <p className="mt-1 text-sm text-white/60">
                Paste a Supabase user ID to rebuild today&apos;s AI meal plan from saved preferences.
              </p>
            </div>
          </div>
          <DashboardRegenerateTool />
        </GlassCard>
      </div>

      {/* Chart + tier breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">This week</p>
              <p className="text-base font-semibold text-white">New signups</p>
            </div>
            <Link
              href="/users"
              className="text-xs text-accent-blue hover:underline"
            >
              View users
            </Link>
          </div>
          <div className="mt-4 h-56">
            <SignupsChart data={snapshot.weeklySignups} />
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">Plan mix</p>
          <p className="text-base font-semibold text-white">Tier breakdown</p>
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.tierBreakdown.map((row) => {
              const pct =
                snapshot.totalUsers > 0
                  ? Math.round((row.count / snapshot.totalUsers) * 100)
                  : 0;
              return (
                <div key={row.tier} className="flex items-center gap-3">
                  <TierBadge tier={row.tier} />
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          row.tier === "Gold"
                            ? "linear-gradient(90deg,#FFD666,#F39E33)"
                            : row.tier === "Silver"
                              ? "linear-gradient(90deg,#4F8CFF,#8F5CFF)"
                              : "rgba(255,255,255,0.35)",
                      }}
                    />
                  </div>
                  <p className="w-14 text-right text-xs text-white/70 tabular-nums">
                    {row.count} . {pct}%
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Revenue / MRR history */}
      <div className="mt-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Revenue</p>
              <p className="text-base font-semibold text-white">MRR over time</p>
            </div>
            <Link
              href="/subscriptions"
              className="text-xs text-accent-blue hover:underline"
            >
              View subscriptions
            </Link>
          </div>
          <div className="mt-4">
            <RevenueChart data={mrrHistory} />
          </div>
        </GlassCard>
      </div>

      {/* Pending payments queue */}
      <div className="mt-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Needs review
              </p>
              <p className="text-base font-semibold text-white">
                Pending ABA payments
              </p>
            </div>
            <Link href="/payments">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Open queue
              </Button>
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">All caught up. No payments waiting.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {recentPayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <Avatar seed={p.userName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {p.userName}
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {p.transactionId} . {relativeFromNow(p.submittedAt)}
                    </p>
                  </div>
                  <TierBadge tier={p.tier} />
                  <p className="hidden text-sm font-semibold text-white sm:block">
                    {p.amount}
                  </p>
                  <PaymentStatusBadge status={p.status} />
                  <Link
                    href={`/payments/${p.id}`}
                    className="text-xs text-accent-blue hover:underline"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}
