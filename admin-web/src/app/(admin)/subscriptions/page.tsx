import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { SetupRequiredBanner } from "@/components/ui/setup-required-banner";
import { DataTable } from "@/components/ui/data-table";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { StatTile } from "@/components/ui/stat-tile";
import { TierBadge } from "@/components/domain/tier-badge";
import { listSubscriptions } from "@/lib/supabase/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { classifySupabaseError } from "@/lib/supabase/setup-check";
import { formatDate } from "@/lib/format";
import type { AdminSubscription } from "@/data/types";
import { AlertTriangle, CreditCard, Inbox, RefreshCcw, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function safeListSubscriptions(): Promise<
  | { ok: true; value: AdminSubscription[] }
  | { ok: false; missingTables: boolean; message: string }
> {
  try {
    const value = await listSubscriptions();
    return { ok: true, value };
  } catch (error) {
    console.error("subscriptions page error:", error);
    const hint = classifySupabaseError(error);
    return {
      ok: false,
      missingTables: hint.isMissingTable,
      message: hint.rawMessage,
    };
  }
}

export default async function SubscriptionsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Subscriptions">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const allRes = await safeListSubscriptions();
  if (!allRes.ok) {
    return (
      <PageShell title="Subscriptions" subtitle="StoreKit + manual ABA subscriptions across all tiers.">
        {allRes.missingTables ? (
          <SetupRequiredBanner page="The subscriptions list" rawMessage={allRes.message} />
        ) : (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Unable to load subscriptions</p>
                <p className="mt-1 text-sm opacity-80 break-all font-mono">
                  {allRes.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    );
  }
  const all = allRes.value;
  const active = all.filter((s) => s.status === "active");
  const pastDue = all.filter((s) => s.status === "past_due");
  const canceled = all.filter((s) => s.status === "canceled");

  const mrrCents = active.reduce(
    (acc, s) => acc + Number(s.monthlyPrice.replace(/[^0-9.]/g, "")) * 100,
    0,
  );
  const mrr = `$${(mrrCents / 100).toFixed(2)}`;

  return (
    <PageShell
      title="Subscriptions"
      subtitle="StoreKit + manual ABA subscriptions across all tiers."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile
          icon={CreditCard}
          label="Active"
          value={active.length}
          delta="StoreKit + ABA"
          tone="purple"
        />
        <StatTile
          icon={RefreshCcw}
          label="Past due"
          value={pastDue.length}
          delta={pastDue.length === 0 ? "All current" : "Needs attention"}
          tone="gold"
        />
        <StatTile
          icon={TrendingUp}
          label="MRR"
          value={mrr}
          delta={`${active.length} paying users`}
          tone="green"
        />
      </div>

      <div className="mt-3">
        <DataTable<AdminSubscription>
          columns={[
            {
              key: "user",
              header: "User",
              render: (s) => (
                <div className="flex items-center gap-2.5">
                  <Avatar seed={s.userName} />
                  <Link
                    href={`/users/${s.userId}`}
                    className="text-sm font-medium text-white hover:underline"
                  >
                    {s.userName}
                  </Link>
                </div>
              ),
            },
            {
              key: "tier",
              header: "Plan",
              render: (s) => <TierBadge tier={s.tier} />,
              width: "w-24",
            },
            {
              key: "source",
              header: "Source",
              render: (s) => (
                <Badge tone={s.source === "storekit" ? "blue" : "purple"}>
                  {s.source === "storekit" ? "App Store" : "ABA manual"}
                </Badge>
              ),
              width: "w-32",
            },
            {
              key: "price",
              header: "Price",
              render: (s) => (
                <span className="font-semibold text-white">{s.monthlyPrice}</span>
              ),
              width: "w-24",
              align: "right",
            },
            {
              key: "started",
              header: "Started",
              render: (s) => (
                <span className="text-xs text-white/65">
                  {formatDate(s.startedAt)}
                </span>
              ),
              width: "w-28",
            },
            {
              key: "renews",
              header: "Renews",
              render: (s) =>
                s.renewsAt ? (
                  <span className="text-xs text-white/65">
                    {formatDate(s.renewsAt)}
                  </span>
                ) : (
                  <span className="text-xs text-white/35">-</span>
                ),
              width: "w-28",
            },
            {
              key: "status",
              header: "Status",
              render: (s) => {
                if (s.status === "active") return <Badge tone="green">Active</Badge>;
                if (s.status === "past_due") return <Badge tone="gold">Past due</Badge>;
                return <Badge tone="outline">Canceled</Badge>;
              },
              width: "w-32",
            },
          ]}
          rows={all}
          emptyState={
            <GlassCard className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
                <Inbox className="h-6 w-6 text-white/70" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">
                No subscriptions yet
              </p>
            </GlassCard>
          }
        />
      </div>

      {canceled.length > 0 && (
        <p className="mt-3 text-[11px] text-white/45">
          {canceled.length} canceled subscriptions hidden from totals but listed
          above.
        </p>
      )}
    </PageShell>
  );
}
