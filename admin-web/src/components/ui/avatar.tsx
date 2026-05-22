import { cn } from "@/lib/cn";

export function Avatar({ seed, className }: { seed: string; className?: string }) {
  // Stable hue from the seed so each user gets a consistent gradient.
  const hue = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-glass",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%) 0%, hsl(${(hue + 40) % 360} 70% 45%) 100%)`,
      }}
    >
      {seed.slice(0, 2).toUpperCase()}
    </div>
  );
}
