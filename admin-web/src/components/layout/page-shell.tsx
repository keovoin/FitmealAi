import { TopBar } from "@/components/layout/top-bar";
import type { ReactNode } from "react";

export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title={title} subtitle={subtitle} />
      {actions && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-2">
          {actions}
        </div>
      )}
      <main className="flex-1 px-6 py-4">{children}</main>
    </div>
  );
}
