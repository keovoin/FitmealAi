import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { StatTile } from "@/components/ui/stat-tile";
import { TierBadge } from "@/components/domain/tier-badge";
import { PaymentStatusBadge } from "@/components/domain/payment-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getDashboardSnapshot } from "@/data/mock-dashboard";
import { MOCK_PAYMENTS } from "@/data/mock-payments";
import { relativeFromNow } from "@/lib/format";
import { ArrowRight, CreditCard, TrendingUp, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { SignupsChart } from "./signups-chart";

export default function DashboardPage() {
  const snapshot = getDashboardSnapshot();
  const recentPayments = [...MOCK_PAYMENTS]
    .filter((p) => p.status === "pending")
    .slice(0, 4);

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
