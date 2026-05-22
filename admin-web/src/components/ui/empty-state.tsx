import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col items-center justify-center gap-3 p-10 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
        <Icon className="h-6 w-6 text-white/70" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-white">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-white/60">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
