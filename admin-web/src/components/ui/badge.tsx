import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type BadgeTone =
  | "neutral"
  | "purple"
  | "blue"
  | "green"
  | "red"
  | "gold"
  | "outline";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-white/10 text-white/80 border-white/15",
  purple: "bg-accent-purple/20 text-white border-accent-purple/40",
  blue: "bg-accent-blue/20 text-white border-accent-blue/40",
  green: "bg-success/20 text-white border-success/40",
  red: "bg-danger/20 text-white border-danger/40",
  gold: "bg-gold-start/25 text-white border-gold-start/50",
  outline: "bg-transparent text-white/70 border-white/20",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
