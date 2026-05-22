"use client";

import { Button } from "@/components/ui/button";
import { regenerateUserMealPlan } from "@/lib/supabase/admin-actions";
import { WandSparkles } from "lucide-react";
import { useState, useTransition } from "react";

export function DashboardRegenerateTool() {
  const [userId, setUserId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function regenerate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await regenerateUserMealPlan(userId);
      if (!result.ok) {
        setFeedback(result.error ?? "Could not regenerate the plan.");
        return;
      }
      setFeedback(`Generated ${result.mealCount ?? 0} meals. Plan ID: ${result.planId}`);
    });
  }

  return (
    <div data-testid="dashboard-regenerate-tool" className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
      <label className="space-y-1 text-xs text-white/60">
        <span>Support regenerate by user ID</span>
        <input
          data-testid="dashboard-regenerate-user-id-input"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          className="glass-input h-10 text-xs"
          placeholder="Paste Supabase user UUID"
        />
      </label>
      <Button
        data-testid="dashboard-regenerate-submit-button"
        type="button"
        variant="secondary"
        size="md"
        loading={pending}
        disabled={!userId.trim()}
        leftIcon={<WandSparkles className="h-4 w-4" />}
        onClick={regenerate}
        className="self-end"
      >
        Regenerate
      </Button>
      {feedback && (
        <p data-testid="dashboard-regenerate-feedback" className="text-xs text-white/60 lg:col-span-2">
          {feedback}
        </p>
      )}
    </div>
  );
}