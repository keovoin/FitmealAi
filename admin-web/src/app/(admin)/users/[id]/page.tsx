import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { PaymentStatusBadge } from "@/components/domain/payment-status-badge";
import { TierBadge } from "@/components/domain/tier-badge";
import { UserStatusBadge } from "@/components/domain/user-status-badge";
import { MOCK_PAYMENTS } from "@/data/mock-payments";
import { MOCK_SUBSCRIPTIONS } from "@/data/mock-subscriptions";
import { MOCK_USERS } from "@/data/mock-users";
import { formatDateTime, relativeFromNow } from "@/lib/format";
import { ChevronLeft, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) notFound();

  const payments = MOCK_PAYMENTS.filter((p) => p.userId === id).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
  const subs = MOCK_SUBSCRIPTIONS.filter((s) => s.userId === id);

  return (
    <PageShell
      title={user.name}
      subtitle={user.email}
      actions={
        <Link
          href="/users"
          className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.14] hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to users
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="space-y-3">
          <GlassCard>
            <div className="flex items-center gap-3">
              <Avatar seed={user.name} className="h-14 w-14 text-base" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-white">
                  {user.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <TierBadge tier={user.tier} />
                  <UserStatusBadge status={user.status} />
                  <Badge tone="outline">{user.country}</Badge>
                </div>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-white/80">
                <Mail className="h-3.5 w-3.5 text-white/55" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-white/80">
                  <Phone className="h-3.5 w-3.5 text-white/55" />
                  <span>{user.phone}</span>
                </div>
              )}
            </dl>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Cell label="Joined" value={formatDateTime(user.joinedAt)} />
              <Cell label="Last active" value={formatDateTime(user.lastActiveAt)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">
                Comp Gold (1mo)
              </Button>
              {user.status === "active" ? (
                <Button variant="danger" size="sm">
                  Suspend
                </Button>
              ) : (
                <Button variant="success" size="sm">
                  Reactivate
                </Button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-white/40">
              Actions are local-only until the backend lands.
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-xs uppercase tracking-wider text-white/50">
              Subscriptions
            </p>
            {subs.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">No subscriptions yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {subs.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TierBadge tier={s.tier} />
                        <Badge tone={s.status === "active" ? "green" : "outline"}>
                          {s.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-white/55">
                        {s.source === "storekit" ? "App Store" : "ABA manual"}
                        {s.renewsAt
                          ? ` . renews ${formatDateTime(s.renewsAt)}`
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {s.monthlyPrice}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>

        <GlassCard className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-white/50">
            Payment history
          </p>
          {payments.length === 0 ? (
            <p className="mt-2 text-sm text-white/60">No payments on file.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <PaymentStatusBadge status={p.status} />
                  <p className="text-sm font-medium text-white">{p.amount}</p>
                  <p className="text-xs font-mono text-white/65">
                    {p.transactionId}
                  </p>
                  <p className="text-xs text-white/55">
                    {relativeFromNow(p.submittedAt)}
                  </p>
                  <Link
                    href={`/payments/${p.id}`}
                    className="ml-auto text-xs text-accent-blue hover:underline"
                  >
                    Open
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

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}
