"use client";

import { cn } from "@/lib/cn";
import {
  CreditCard,
  LayoutDashboard,
  Leaf,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/payments", label: "Payments", icon: Wallet, badgeKey: "pendingPayments" as const },
  { href: "/users", label: "Users", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ pendingPayments }: { pendingPayments: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-3 border-r border-white/10 bg-black/20 p-4 backdrop-blur-2xl lg:flex">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.06]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-gradient shadow-glow">
          <Leaf className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">FitMeal AI</p>
          <p className="text-[11px] text-white/50">Admin CMS</p>
        </div>
      </Link>

      <nav className="mt-2 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/[0.10] text-white"
                  : "text-white/65 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-accent-purple" : "text-white/50 group-hover:text-white/80",
                  )}
                />
                {item.label}
              </span>
              {item.badgeKey === "pendingPayments" && pendingPayments > 0 && (
                <span className="rounded-full bg-gold-start/30 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {pendingPayments}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/55">
        v0.1.0 . Phase 3 admin
      </div>
    </aside>
  );
}
