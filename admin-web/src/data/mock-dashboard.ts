import { MOCK_PAYMENTS } from "./mock-payments";
import { MOCK_SUBSCRIPTIONS } from "./mock-subscriptions";
import { MOCK_USERS } from "./mock-users";
import type { DashboardSnapshot, SeriesPoint, SubscriptionTier } from "./types";

function buildWeeklySignups(): SeriesPoint[] {
  return [
    { label: "Mon", value: 8 },
    { label: "Tue", value: 12 },
    { label: "Wed", value: 6 },
    { label: "Thu", value: 14 },
    { label: "Fri", value: 18 },
    { label: "Sat", value: 22 },
    { label: "Sun", value: 16 },
  ];
}

function buildTierBreakdown() {
  const tiers: SubscriptionTier[] = ["Free", "Silver", "Gold"];
  return tiers.map((tier) => ({
    tier,
    count: MOCK_USERS.filter((u) => u.tier === tier).length,
  }));
}

export function getDashboardSnapshot(): DashboardSnapshot {
  const activeSubs = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "active").length;
  const pendingPayments = MOCK_PAYMENTS.filter((p) => p.status === "pending").length;
  const newUsersThisWeek = 12; // hardcoded for the prototype

  // Rough MRR: sum monthlyPrice of active subs
  const mrrCents = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "active").reduce(
    (acc, s) => acc + Number(s.monthlyPrice.replace(/[^0-9.]/g, "")) * 100,
    0,
  );
  const mrr = `$${(mrrCents / 100).toFixed(2)}`;

  return {
    totalUsers: MOCK_USERS.length,
    newUsersThisWeek,
    activeSubs,
    pendingPayments,
    mrr,
    weeklySignups: buildWeeklySignups(),
    tierBreakdown: buildTierBreakdown(),
  };
}
