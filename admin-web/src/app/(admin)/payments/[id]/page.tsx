import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { PaymentStatusBadge } from "@/components/domain/payment-status-badge";
import { TierBadge } from "@/components/domain/tier-badge";
import { MOCK_PAYMENTS } from "@/data/mock-payments";
import { MOCK_USERS } from "@/data/mock-users";
import { formatDateTime } from "@/lib/format";
import { ChevronLeft, ImageIcon, Mail } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewPanel } from "./review-panel";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = MOCK_PAYMENTS.find((p) => p.id === id);
  if (!payment) notFound();

  const user = MOCK_USERS.find((u) => u.id === payment.userId);

  return (
    <PageShell
      title={`Payment ${payment.id}`}
      subtitle={`${payment.transactionId} . ${payment.amount}`}
      actions={
        <Link
          href="/payments"
          className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.14] hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to payments
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <GlassCard>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-white/50">
                Receipt
              </p>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <div className="mt-3">
              {payment.screenshotFileName ? (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <div className="flex flex-col items-center gap-2 text-white/60">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-sm font-medium">
                      {payment.screenshotFileName}
                    </p>
                    <p className="text-xs">
                      Real screenshot rendering arrives with the backend
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-danger/40 bg-danger/[0.06]">
                  <p className="text-sm text-danger">No screenshot attached</p>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-xs uppercase tracking-wider text-white/50">
              Details
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Transaction ID" value={payment.transactionId} mono />
              <Detail label="Plan">
                <TierBadge tier={payment.tier} />
              </Detail>
              <Detail label="Amount" value={payment.amount} />
              <Detail label="Submitted" value={formatDateTime(payment.submittedAt)} />
              {payment.reviewedAt && (
                <Detail label="Reviewed" value={formatDateTime(payment.reviewedAt)} />
              )}
              {payment.reviewerNote && (
                <Detail label="Reviewer note" value={payment.reviewerNote} fullWidth />
              )}
            </dl>
          </GlassCard>
        </div>

        <div className="space-y-3">
          <GlassCard>
            <p className="text-xs uppercase tracking-wider text-white/50">User</p>
            {user ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar seed={user.name} className="h-12 w-12 text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">
                    {user.name}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-white/65">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                  <div className="mt-1.5">
                    <Link
                      href={`/users/${user.id}`}
                      className="text-xs text-accent-blue hover:underline"
                    >
                      Open user profile
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/60">
                User no longer exists ({payment.userId})
              </p>
            )}
          </GlassCard>

          <ReviewPanel payment={payment} />
        </div>
      </div>
    </PageShell>
  );
}

function Detail({
  label,
  value,
  children,
  mono,
  fullWidth,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  mono?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : undefined}>
      <dt className="text-[11px] uppercase tracking-wider text-white/45">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-white ${mono ? "font-mono" : ""}`}
      >
        {children ?? value ?? "-"}
      </dd>
    </div>
  );
}
