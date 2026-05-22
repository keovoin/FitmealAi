"use client";

import { Button } from "@/components/ui/button";
import { compGold, setUserStatus } from "@/lib/supabase/admin-actions";
import type { SubscriptionTier, UserStatus } from "@/data/types";
import { useTransition, useState } from "react";

export function UserActions({
  userId,
  status,
  tier,
}: {
  userId: string;
  status: UserStatus;
  tier: SubscriptionTier;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function run(label: string, action: () => Promise<{ ok: boolean; error?: string; already?: boolean }>) {
    setFeedback(null);
    setBusy(label);
    startTransition(async () => {
      const result = await action();
      setBusy(null);
      if (!result.ok) {
        setFeedback(result.error ?? "Something went wrong");
        return;
      }
      if (result.already) {
        setFeedback("User already has an active Gold subscription.");
        return;
      }
      setFeedback("Done. The page will refresh momentarily.");
    });
  }

  const isActive = status === "active";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={busy === "comp" || pending}
          disabled={tier === "Gold"}
          onClick={() => run("comp", () => compGold(userId))}
        >
          Comp Gold (30d)
        </Button>

        {isActive ? (
          <Button
            variant="danger"
            size="sm"
            loading={busy === "suspend" || pending}
            onClick={() => run("suspend", () => setUserStatus(userId, "suspended"))}
          >
            Suspend
          </Button>
        ) : (
          <Button
            variant="success"
            size="sm"
            loading={busy === "reactivate" || pending}
            onClick={() => run("reactivate", () => setUserStatus(userId, "active"))}
          >
            Reactivate
          </Button>
        )}
      </div>

      {feedback && (
        <p className="text-[11px] text-white/55">{feedback}</p>
      )}
    </div>
  );
}
