import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { SetupRequiredBanner } from "@/components/ui/setup-required-banner";
import { DataTable } from "@/components/ui/data-table";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  getReferralStats,
  listAllReferrals,
  listReferralCodes,
  type AdminReferral,
  type AdminReferralCode,
  type AdminReferralStats,
  type ReferralStatus,
} from "@/lib/supabase/admin-referrals";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { classifySupabaseError } from "@/lib/supabase/setup-check";
import { relativeFromNow } from "@/lib/format";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Inbox,
  Share2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { ReferralActions } from "./referral-actions";

export const dynamic = "force-dynamic";

interface PageData {
  codes: AdminReferralCode[];
  referrals: AdminReferral[];
  stats: AdminReferralStats;
}

async function safeLoad(): Promise<
  | { ok: true; value: PageData }
  | { ok: false; missingTables: boolean; message: string }
> {
  try {
    const [codes, referrals, stats] = await Promise.all([
      listReferralCodes(),
      listAllReferrals(),
      getReferralStats(),
    ]);
    return { ok: true, value: { codes, referrals, stats } };
  } catch (error) {
    console.error("referrals page error:", error);
    const hint = classifySupabaseError(error);
    return {
      ok: false,
      missingTables: hint.isMissingTable,
      message: hint.rawMessage,
    };
  }
}

const STATUS_TABS: Array<{ key: ReferralStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rewarded", label: "Rewarded" },
  { key: "rejected", label: "Rejected" },
];

function statusTone(status: ReferralStatus): "green" | "gold" | "purple" | "red" {
  switch (status) {
    case "verified":
      return "green";
    case "rewarded":
      return "purple";
    case "rejected":
      return "red";
    case "pending":
    default:
      return "gold";
  }
}

export default async function ReferralsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status as ReferralStatus | "all") ?? "all";
  const query = (params.q ?? "").trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Referrals">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const result = await safeLoad();
  if (!result.ok) {
    return (
      <PageShell
        title="Referrals"
        subtitle="Codes, conversion, and per-referral overrides."
      >
        {result.missingTables ? (
          <SetupRequiredBanner
            page="The referrals admin"
            rawMessage={result.message}
          />
        ) : (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Unable to load referrals</p>
                <p className="mt-1 break-all font-mono text-sm opacity-80">
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    );
  }

  const { codes, referrals, stats } = result.value;

  const filteredReferrals = referrals.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!query) return true;
    return (
      r.referrerName.toLowerCase().includes(query) ||
      r.referredName.toLowerCase().includes(query) ||
      r.referrerId.toLowerCase().includes(query) ||
      r.referredId.toLowerCase().includes(query)
    );
  });

  return (
    <PageShell
      title="Referrals"
      subtitle="Codes, conversion, and per-referral overrides."
    >
      {/* Stat row -------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Share2}
          label="Active codes"
          value={stats.totalCodes}
          delta={`${stats.totalReferrals} total referrals`}
          tone="purple"
        />
        <StatTile
          icon={Clock}
          label="Pending"
          value={stats.pending}
          delta="Awaiting verification"
          tone="gold"
        />
        <StatTile
          icon={CheckCircle2}
          label="Verified"
          value={stats.verified}
          delta="Counts toward rewards"
          tone="blue"
        />
        <StatTile
          icon={Award}
          label="Rewarded"
          value={stats.rewarded}
          delta="30 days Gold each"
          tone="green"
        />
      </div>

      {/* Codes list ------------------------------------------------------ */}
      <div className="mt-3">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Codes
              </p>
              <p className="text-base font-semibold text-white">
                {codes.length} active referral code{codes.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <DataTable<AdminReferralCode>
              columns={[
                {
                  key: "user",
                  header: "Owner",
                  render: (c) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar seed={c.userName} className="h-8 w-8" />
                      <div className="min-w-0">
                        <Link
                          href={`/users/${c.userId}`}
                          className="truncate text-sm font-medium text-white hover:underline"
                        >
                          {c.userName}
                        </Link>
                        {c.userEmail && (
                          <p className="truncate text-xs text-white/55">
                            {c.userEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "code",
                  header: "Code",
                  render: (c) => (
                    <code className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-white">
                      {c.code}
                    </code>
                  ),
                  width: "w-32",
                },
                {
                  key: "pending",
                  header: "Pending",
                  render: (c) => (
                    <Badge tone={c.pending > 0 ? "gold" : "outline"}>
                      {c.pending}
                    </Badge>
                  ),
                  width: "w-24",
                  align: "center",
                },
                {
                  key: "verified",
                  header: "Verified",
                  render: (c) => (
                    <Badge tone={c.verified > 0 ? "green" : "outline"}>
                      {c.verified}
                    </Badge>
                  ),
                  width: "w-24",
                  align: "center",
                },
                {
                  key: "rewarded",
                  header: "Rewarded",
                  render: (c) => (
                    <Badge tone={c.rewarded > 0 ? "purple" : "outline"}>
                      {c.rewarded}
                    </Badge>
                  ),
                  width: "w-24",
                  align: "center",
                },
                {
                  key: "created",
                  header: "Created",
                  render: (c) => (
                    <span className="text-xs text-white/65">
                      {relativeFromNow(c.createdAt)}
                    </span>
                  ),
                  width: "w-32",
                },
              ]}
              rows={codes}
              emptyState={
                <GlassCard className="p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
                    <Inbox className="h-6 w-6 text-white/70" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    No referral codes yet
                  </p>
                  <p className="text-xs text-white/55">
                    Codes are auto-generated the first time a user opens the
                    referral screen in the app.
                  </p>
                </GlassCard>
              }
            />
          </div>
        </GlassCard>
      </div>

      {/* Referrals list -------------------------------------------------- */}
      <div className="mt-3">
        <GlassCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Referral activity
              </p>
              <p className="text-base font-semibold text-white">
                Per-referral status &amp; overrides
              </p>
            </div>
            <form className="flex items-center gap-2" action="/referrals">
              {statusFilter !== "all" && (
                <input type="hidden" name="status" value={statusFilter} />
              )}
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by referrer or referred"
                className="glass-input h-9 w-72 max-w-full"
              />
            </form>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => {
              const active = tab.key === statusFilter;
              const url = new URLSearchParams();
              if (tab.key !== "all") url.set("status", tab.key);
              if (query) url.set("q", query);
              const href = url.toString()
                ? `/referrals?${url.toString()}`
                : "/referrals";
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
                </Link>
              );
            })}
          </div>

          <div className="mt-3">
            <DataTable<AdminReferral>
              columns={[
                {
                  key: "referrer",
                  header: "Referrer",
                  render: (r) => (
                    <Link
                      href={`/users/${r.referrerId}`}
                      className="text-sm font-medium text-white hover:underline"
                    >
                      {r.referrerName}
                    </Link>
                  ),
                },
                {
                  key: "referred",
                  header: "Referred user",
                  render: (r) => (
                    <Link
                      href={`/users/${r.referredId}`}
                      className="text-sm text-white/85 hover:underline"
                    >
                      {r.referredName}
                    </Link>
                  ),
                },
                {
                  key: "device",
                  header: "Device",
                  render: (r) =>
                    r.deviceFingerprint ? (
                      <span
                        title={r.deviceFingerprint}
                        className="font-mono text-[11px] text-white/60"
                      >
                        {r.deviceFingerprint.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-xs text-white/35">—</span>
                    ),
                  width: "w-28",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => (
                    <Badge tone={statusTone(r.status)}>
                      {r.status === "rejected" && (
                        <XCircle className="h-3 w-3" />
                      )}
                      {r.status}
                    </Badge>
                  ),
                  width: "w-32",
                },
                {
                  key: "created",
                  header: "Created",
                  render: (r) => (
                    <span className="text-xs text-white/65">
                      {relativeFromNow(r.createdAt)}
                    </span>
                  ),
                  width: "w-28",
                },
                {
                  key: "verified",
                  header: "Verified",
                  render: (r) =>
                    r.verifiedAt ? (
                      <span className="text-xs text-white/65">
                        {relativeFromNow(r.verifiedAt)}
                      </span>
                    ) : (
                      <span className="text-xs text-white/35">—</span>
                    ),
                  width: "w-28",
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) => <ReferralActions referral={r} />,
                  width: "w-44",
                  align: "right",
                },
              ]}
              rows={filteredReferrals}
              emptyState={
                <GlassCard className="p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
                    <Inbox className="h-6 w-6 text-white/70" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    No referrals match
                  </p>
                  <p className="text-xs text-white/55">
                    Adjust the filter or clear the search.
                  </p>
                </GlassCard>
              }
            />
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
