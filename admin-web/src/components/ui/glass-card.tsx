import { cn } from "@/lib/cn";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Mirrors iOS GlassCard: ultraThin material fill, white 0.20 stroke,
 * 24px radius, soft shadow.
 */
export function GlassCard({
  className,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("glass-card p-5", className)} {...rest} />;
}
