import { Avatar } from "@/components/ui/avatar";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { DataTable } from "@/components/ui/data-table";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { TierBadge } from "@/components/domain/tier-badge";
import { UserStatusBadge } from "@/components/domain/user-status-badge";
import { listUsers } from "@/lib/supabase/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { relativeFromNow } from "@/lib/format";
import type { AdminUser, SubscriptionTier, UserStatus } from "@/data/types";
import { Inbox } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TIER_TABS: Array<{ key: SubscriptionTier | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "Free", label: "Free" },
  { key: "Silver", label: "Silver" },
  { key: "Gold", label: "Gold" },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tierFilter = (params.tier as SubscriptionTier | "all") ?? "all";
  const statusFilter = (params.status as UserStatus | "all") ?? "all";
  const query = (params.q ?? "").trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Users">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const allUsers = await listUsers();
  const rows = allUsers.filter((u) => {
    if (tierFilter !== "all" && u.tier !== tierFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (!query) return true;
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone ?? "").toLowerCase().includes(query)
    );
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PageShell title="Users" subtitle="Search, filter, and inspect customer accounts.">
      <div className="flex flex-wrap items-center gap-2">
        {TIER_TABS.map((tab) => {
          const active = tab.key === tierFilter;
          const url = new URLSearchParams();
          if (tab.key !== "all") url.set("tier", tab.key);
          if (statusFilter !== "all") url.set("status", statusFilter);
          if (query) url.set("q", query);
          const href = url.toString() ? `/users?${url.toString()}` : "/users";
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

        <form action="/users" className="ml-auto flex items-center gap-2">
          {tierFilter !== "all" && (
            <input type="hidden" name="tier" value={tierFilter} />
          )}
          <select
            name="status"
            defaultValue={statusFilter}
            className="glass-input h-9 w-32"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name, email, phone"
            className="glass-input h-9 w-72 max-w-full"
          />
        </form>
      </div>

      <div className="mt-3">
        <DataTable<AdminUser>
          columns={[
            {
              key: "user",
              header: "User",
              render: (u) => (
                <div className="flex items-center gap-2.5">
                  <Avatar seed={u.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {u.name}
                    </p>
                    <p className="truncate text-xs text-white/55">{u.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "tier",
              header: "Plan",
              render: (u) => <TierBadge tier={u.tier} />,
              width: "w-24",
            },
            {
              key: "status",
              header: "Status",
              render: (u) => <UserStatusBadge status={u.status} />,
              width: "w-32",
            },
            {
              key: "country",
              header: "Country",
              render: (u) => (
                <span className="font-mono text-xs text-white/70">{u.country}</span>
              ),
              width: "w-20",
            },
            {
              key: "joined",
              header: "Joined",
              render: (u) => (
                <span className="text-xs text-white/65">
                  {relativeFromNow(u.joinedAt)}
                </span>
              ),
              width: "w-32",
            },
            {
              key: "active",
              header: "Last active",
              render: (u) => (
                <span className="text-xs text-white/65">
                  {relativeFromNow(u.lastActiveAt)}
                </span>
              ),
              width: "w-32",
            },
            {
              key: "actions",
              header: "",
              render: (u) => (
                <Link
                  href={`/users/${u.id}`}
                  className="text-xs text-accent-blue hover:underline"
                >
                  Open
                </Link>
              ),
              width: "w-16",
              align: "right",
            },
          ]}
          rows={rows}
          emptyState={
            <GlassCard className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
                <Inbox className="h-6 w-6 text-white/70" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">No users match</p>
              <p className="text-xs text-white/55">
                Adjust filters or search and try again.
              </p>
            </GlassCard>
          }
        />
      </div>
    </PageShell>
  );
}
