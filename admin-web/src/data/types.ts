// Admin domain types. These intentionally mirror (and extend) the iOS
// Core/Models so the future backend can serve both the app and the CMS.

export type SubscriptionTier = "Free" | "Silver" | "Gold";

export type PaymentStatus = "draft" | "pending" | "approved" | "rejected";

export type UserStatus = "active" | "suspended" | "deleted";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tier: SubscriptionTier;
  status: UserStatus;
  joinedAt: string; // ISO date
  lastActiveAt: string; // ISO date
  country: string;
  avatarSeed: string; // initials fallback
}

export interface AdminPayment {
  id: string;
  userId: string;
  userName: string;
  tier: SubscriptionTier;
  amount: string;
  transactionId: string;
  screenshotFileName: string | null;
  status: PaymentStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  tier: SubscriptionTier;
  source: "storekit" | "aba_manual";
  startedAt: string;
  renewsAt?: string;
  status: "active" | "canceled" | "past_due";
  monthlyPrice: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DashboardSnapshot {
  totalUsers: number;
  newUsersThisWeek: number;
  activeSubs: number;
  pendingPayments: number;
  mrr: string;
  weeklySignups: SeriesPoint[];
  tierBreakdown: { tier: SubscriptionTier; count: number }[];
}
