import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/data/types";
import { CheckCircle2, Hourglass, XCircle } from "lucide-react";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "pending":
      return (
        <Badge tone="gold">
          <Hourglass className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge tone="green">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge tone="red">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return <Badge tone="neutral">Draft</Badge>;
  }
}
