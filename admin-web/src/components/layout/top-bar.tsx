import { LogOut } from "lucide-react";
import Link from "next/link";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-2">
      <div>
        <p className="text-xs uppercase tracking-wider text-white/50">FitMeal Admin</p>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="glass-pill flex items-center gap-2 px-3 py-1.5 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full bg-success" />
          Mock data
        </div>
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
