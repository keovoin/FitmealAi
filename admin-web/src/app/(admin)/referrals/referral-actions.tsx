"use client";

import { Button } from "@/components/ui/button";
import { setReferralStatus } from "@/lib/supabase/admin-actions";
import type { AdminReferral } from "@/lib/supabase/admin-referrals";
import { Check, X } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Per-row admin overrides for a single referral. Only meaningful for
 * pending rows; verified/rewarded/rejected rows display a disabled
 * label so admins can see the action was taken.
 */
export function ReferralActions({ referral }: { referral: AdminReferral }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isFinal = referral.status !== "pending";

  function act(next: "verified" | "rejected") {
    setError(null);
    startTransition(async () => {
      const result = await setReferralStatus(referral.id, next);
      if (!result.ok) setError(result.error);
    });
  }

  if (isFinal) {
    return (
      <span className="text-[11px] text-white/40">
        Locked
      </span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="success"
        leftIcon={<Check className="h-3 w-3" />}
        loading={pending}
        onClick={() => act("verified")}
        data-testid={`referral-verify-${referral.id}`}
      >
        Verify
      </Button>
      <Button
        type="button"
        size="sm"
        variant="danger"
        leftIcon={<X className="h-3 w-3" />}
        loading={pending}
        onClick={() => act("rejected")}
        data-testid={`referral-reject-${referral.id}`}
      >
        Reject
      </Button>
      {error && (
        <span className="ml-1 text-[10px] text-red-300" title={error}>
          err
        </span>
      )}
    </div>
  );
}
