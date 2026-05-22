import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { DataTable } from "@/components/ui/data-table";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { PaymentStatusBadge } from "@/components/domain/payment-status-badge";
import { TierBadge } from "@/components/domain/tier-badge";
import { listPayments } from "@/lib/supabase/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { relativeFromNow } from "@/lib/format";
import type { AdminPayment, PaymentStatus } from "@/data/types";
import { Inbox } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_TABS: Array<{ key: PaymentStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status as PaymentStatus | "all") ?? "pending";
  const query = (params.q ?? "").trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Payments">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const allPayments = await listPayments();
  const rows = allPayments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!query) return true;
    return (
      p.userName.toLowerCase().includes(query) ||
      p.transactionId.toLowerCase().includes(query)
    );
  });

  const counts = {
    pending: allPayments.filter((p) => p.status === "pending").length,
    approved: allPayments.filter((p) => p.status === "approved").length,
    rejected: allPayments.filter((p) => p.status === "rejected").length,
    all: allPayments.length,
  } as const;

  return (
    <PageShell
      title="Payments"
      subtitle="Review manual ABA receipts and approve subscriptions."
    >
      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === statusFilter;
          const url = new URLSearchParams();
          if (tab.key !== "pending") url.set("status", tab.key);
          if (query) url.set("q", query);
          const href = url.toString() ? `/payments?${url.toString()}` : "/payments";
          return (
            <Link
              key={tab.key}
              href={href}
              className={`glass-pill px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-white/[0.16] text-white"
                  : "text-white/65 hover:bg-white/[0.10] hover:text-white"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-white/45">
                {counts[tab.key as keyof typeof counts]}
              </span>
            </Link>
          );
        })}
        <form className="ml-auto" action="/payments">
          {statusFilter !== "pending" && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            name="q"
            defaultValue={query}
            placeholder="Search name or transaction"
            className="glass-input h-9 w-72 max-w-full"
          />
        </form>
      </div>

      <div className="mt-3">
        <DataTable<AdminPayment>
          columns={[
            {
              key: "user",
              header: "User",
              render: (p) => (
                <div className="flex items-center gap-2.5">
                  <Avatar seed={p.userName} className="h-8 w-8" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {p.userName}
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {p.transactionId}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "tier",
              header: "Plan",
              render: (p) => <TierBadge tier={p.tier} />,
              width: "w-24",
            },
            {
              key: "amount",
              header: "Amount",
              render: (p) => (
                <span className="font-semibold text-white">{p.amount}</span>
              ),
              width: "w-24",
              align: "right",
            },
            {
              key: "submitted",
              header: "Submitted",
              render: (p) => (
                <span className="text-xs text-white/65">
                  {relativeFromNow(p.submittedAt)}
                </span>
              ),
              width: "w-32",
            },
            {
              key: "screenshot",
              header: "Receipt",
              render: (p) =>
                p.screenshotFileName ? (
                  <Badge tone="green">Attached</Badge>
                ) : (
                  <Badge tone="red">Missing</Badge>
                ),
              width: "w-28",
            },
            {
              key: "status",
              header: "Status",
              render: (p) => <PaymentStatusBadge status={p.status} />,
              width: "w-32",
            },
            {
              key: "actions",
              header: "",
              render: (p) => (
                <Link
                  href={`/payments/${p.id}`}
                  className="text-xs text-accent-blue hover:underline"
                >
                  Review
                </Link>
              ),
              width: "w-20",
              align: "right",
            },
          ]}
          rows={rows}
          emptyState={
            <GlassCard className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
                <Inbox className="h-6 w-6 text-white/70" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">
                No payments match
              </p>
              <p className="text-xs text-white/55">
                Try a different status tab or clear the search.
              </p>
            </GlassCard>
          }
        />
      </div>
    </PageShell>
  );
}
