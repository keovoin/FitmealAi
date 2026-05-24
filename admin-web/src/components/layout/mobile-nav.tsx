"use client";

import { cn } from "@/lib/cn";
import {
  ChefHat,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Bottom tab bar visible only on mobile (< lg breakpoint). Shows the
 * 5 most critical admin pages. The full sidebar is accessible from
 * the hamburger/home icon in the top bar.
 */
const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/payments", label: "Payments", icon: Wallet, badgeKey: "pendingPayments" as const },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "More", icon: Settings },
];

export function MobileNav({ pendingPayments }: { pendingPayments: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-white/10 bg-black/80 backdrop-blur-xl lg:hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px]",
              active ? "text-accent-purple" : "text-white/55",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{tab.label}</span>
            {tab.badgeKey === "pendingPayments" && pendingPayments > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-start/90 text-[8px] font-bold text-black">
                {pendingPayments > 9 ? "9+" : pendingPayments}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
