import { Badge } from "@/components/ui/badge";
import type { SubscriptionTier } from "@/data/types";
import { Sparkles } from "lucide-react";

export function TierBadge({ tier }: { tier: SubscriptionTier }) {
  if (tier === "Gold") {
    return (
      <Badge tone="gold">
        <Sparkles className="h-3 w-3" />
        {tier}
      </Badge>
    );
  }
  if (tier === "Silver") {
    return <Badge tone="blue">{tier}</Badge>;
  }
  return <Badge tone="outline">{tier}</Badge>;
}
