import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  icon: Icon,
  label,
  value,
  delta,
  tone = "purple",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "purple" | "blue" | "green" | "gold";
}) {
  const tones: Record<string, string> = {
    purple: "from-accent-purple/30 to-accent-purple/0",
    blue: "from-accent-blue/30 to-accent-blue/0",
    green: "from-success/30 to-success/0",
    gold: "from-gold-start/30 to-gold-start/0",
  };
  const iconBg: Record<string, string> = {
    purple: "bg-accent-purple/80",
    blue: "bg-accent-blue/80",
    green: "bg-success/80",
    gold: "bg-gold-start/80",
  };

  return (
    <div className="stat-tile relative overflow-hidden">
      <div
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-50 blur-3xl",
          tones[tone],
        )}
      />
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          iconBg[tone],
        )}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="relative">
        <p className="text-xs uppercase tracking-wider text-white/50">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
        {delta && <p className="text-xs text-white/60">{delta}</p>}
      </div>
    </div>
  );
}
