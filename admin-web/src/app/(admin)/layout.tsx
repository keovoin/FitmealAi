import { Sidebar } from "@/components/layout/sidebar";
import { MOCK_PAYMENTS } from "@/data/mock-payments";
import { isAuthenticated } from "@/lib/auth";
import { getPendingPaymentsCount } from "@/lib/supabase/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
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
  // Pending count powers the sidebar badge. Fall back to mock count when
  // Supabase isn't configured so the UI still looks right during setup.
  let pendingPayments = 0;
  if (isSupabaseConfigured()) {
    try {
      pendingPayments = await getPendingPaymentsCount();
    } catch {
      pendingPayments = 0;
    }
  } else {
    pendingPayments = MOCK_PAYMENTS.filter((p) => p.status === "pending").length;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar pendingPayments={pendingPayments} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
