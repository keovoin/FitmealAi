import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/data/types";

export function UserStatusBadge({ status }: { status: UserStatus }) {
  if (status === "active")
    return (
      <Badge tone="green">
        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
      </Badge>
    );
  if (status === "suspended")
    return <Badge tone="red">Suspended</Badge>;
  return <Badge tone="outline">Deleted</Badge>;
}
