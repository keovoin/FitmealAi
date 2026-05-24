import { LogOut, Menu } from "lucide-react";
import Link from "next/link";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-2">
      <div className="flex items-center gap-3">
        {/* Mobile nav link — sidebar is hidden on mobile */}
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] lg:hidden"
          aria-label="Home"
        >
          <Menu className="h-4 w-4 text-white/70" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wider text-white/50">FitMeal Admin</p>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/api/logout"
          prefetch={false}
          className="glass-pill flex items-center gap-2 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.14]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Link>
      </div>
    </div>
  );
}
