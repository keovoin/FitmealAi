import { Sidebar } from "@/components/layout/sidebar";
import { MOCK_PAYMENTS } from "@/data/mock-payments";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Protected layout for every admin page. Lives in the `(admin)` route
 * group so it does NOT wrap the /login page.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const pendingPayments = MOCK_PAYMENTS.filter((p) => p.status === "pending").length;

  return (
    <div className="flex min-h-screen">
      <Sidebar pendingPayments={pendingPayments} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
