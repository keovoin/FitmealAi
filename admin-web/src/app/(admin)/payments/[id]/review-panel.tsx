"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { AdminPayment } from "@/data/types";
import { Check, X } from "lucide-react";
import { useState } from "react";

/**
 * Local-only review actions. Phase-4 will POST to a real API; for now
 * we just flip local state so the admin can demo the flow end-to-end.
 */
export function ReviewPanel({ payment }: { payment: AdminPayment }) {
  const [status, setStatus] = useState(payment.status);
  const [note, setNote] = useState(payment.reviewerNote ?? "");
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);

  const isFinal = status === "approved" || status === "rejected";
  const missingScreenshot = !payment.screenshotFileName;

  async function review(decision: "approve" | "reject") {
    setSubmitting(decision);
    // Simulate latency.
    await new Promise((r) => setTimeout(r, 400));
    setStatus(decision === "approve" ? "approved" : "rejected");
    setSubmitting(null);
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
          Decision recorded locally. The backend will persist this in the
          next phase.
        </p>
      )}
    </GlassCard>
  );
}
