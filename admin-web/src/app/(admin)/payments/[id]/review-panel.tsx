"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { AdminPayment } from "@/data/types";
import { reviewPayment } from "@/lib/supabase/admin-actions";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Review actions backed by the `reviewPayment` Server Action. On approve,
 * the database trigger `on_payment_approved` also bumps the user's tier
 * and creates an active subscription row.
 */
export function ReviewPanel({ payment }: { payment: AdminPayment }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [status, setStatus] = useState(payment.status);
  const [note, setNote] = useState(payment.reviewerNote ?? "");
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFinal = status === "approved" || status === "rejected";
  const missingScreenshot = !payment.screenshotFileName;

  function review(decision: "approve" | "reject") {
    setError(null);
    setSubmitting(decision);
    startTransition(async () => {
      const result = await reviewPayment(payment.id, decision, note);
      setSubmitting(null);
      if (!result.ok) {
        setError(result.error ?? "Could not save the decision");
        return;
      }
      setStatus(decision === "approve" ? "approved" : "rejected");
      // Pull fresh data from the server so the dashboard counts and the
      // user's tier reflect immediately.
      router.refresh();
    });
  }

  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-wider text-white/50">Review</p>

      <label className="mt-3 flex flex-col gap-1.5 text-xs font-medium text-white/70">
        Reviewer note (optional)
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Receipt matches account."
          className="glass-input min-h-[72px] resize-none"
          disabled={isFinal}
        />
      </label>

      {missingScreenshot && status === "pending" && (
        <p className="mt-2 text-xs text-danger">
          No screenshot is attached. You can still reject directly.
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="success"
          loading={submitting === "approve"}
          disabled={isFinal || missingScreenshot}
          onClick={() => review("approve")}
          leftIcon={<Check className="h-4 w-4" />}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          loading={submitting === "reject"}
          disabled={isFinal}
          onClick={() => review("reject")}
          leftIcon={<X className="h-4 w-4" />}
        >
          Reject
        </Button>
      </div>

      {isFinal && (
        <p className="mt-3 text-xs text-white/55">
          Saved. The user&apos;s tier is updated automatically on approval.
        </p>
      )}
    </GlassCard>
  );
}
