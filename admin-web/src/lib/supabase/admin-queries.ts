import "server-only";
import { getSupabaseAdmin } from "./server";
import type {
  PaymentRequestRow,
  PaymentStatusDb,
  ProfileRow,
  SubscriptionRow,
  SubscriptionTierDb,
  UserStatusDb,
} from "./types";
import type {
  AdminPayment,
  AdminSubscription,
  AdminUser,
  DashboardSnapshot,
  PaymentStatus,
  SeriesPoint,
  SubscriptionTier,
  UserStatus,
} from "@/data/types";

// ---------------------------------------------------------------------------
// Type adapters: DB row -> admin domain type used by the UI
// ---------------------------------------------------------------------------

const TIER_TO_UI: Record<SubscriptionTierDb, SubscriptionTier> = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
};

const STATUS_TO_UI: Record<UserStatusDb, UserStatus> = {
  active: "active",
  suspended: "suspended",
  deleted: "deleted",
};

const PAYMENT_STATUS_TO_UI: Record<PaymentStatusDb, PaymentStatus> = {
  draft: "draft",
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

function profileToAdminUser(row: ProfileRow): AdminUser {
  return {
    id: row.id,
    name: row.display_name?.trim() || row.email.split("@")[0],
    email: row.email,
    phone: row.phone ?? undefined,
    tier: TIER_TO_UI[row.tier],
    status: STATUS_TO_UI[row.status],
    joinedAt: row.created_at,
    lastActiveAt: row.last_active_at ?? row.updated_at,
    country: row.country ?? "--",
    avatarSeed: (row.display_name?.trim() || row.email)
      .split(/[\s.@]+/)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "FM",
  };
}

function paymentToAdminPayment(
  row: PaymentRequestRow,
  userName: string,
): AdminPayment {
  return {
    id: row.id,
    userId: row.user_id,
    userName,
    tier: TIER_TO_UI[row.tier],
    amount: row.amount,
    transactionId: row.transaction_id,
    screenshotFileName: row.receipt_storage_path,
    status: PAYMENT_STATUS_TO_UI[row.status],
    submittedAt: row.submitted_at ?? row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewerNote: row.reviewer_note ?? undefined,
  };
}

function subscriptionToAdmin(
  row: SubscriptionRow,
  userName: string,
): AdminSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    userName,
    tier: TIER_TO_UI[row.tier],
    source: row.source === "storekit" ? "storekit" : "aba_manual",
    startedAt: row.started_at,
    renewsAt: row.renews_at ?? undefined,
    status:
      row.status === "active"
        ? "active"
        : row.status === "canceled"
          ? "canceled"
          : "past_due",
    monthlyPrice: row.monthly_price,
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function listUsers(): Promise<AdminUser[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("profiles")
    .select(
      "id,email,display_name,phone,country,tier,status,created_at,updated_at,last_active_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(`listUsers: ${error.message}`);
  return (data ?? []).map((r) => profileToAdminUser(r as ProfileRow));
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("profiles")
    .select(
      "id,email,display_name,phone,country,tier,status,created_at,updated_at,last_active_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getUserById: ${error.message}`);
  return data ? profileToAdminUser(data as ProfileRow) : null;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

interface PaymentJoinedRow extends PaymentRequestRow {
  profiles: { display_name: string | null; email: string } | null;
}

export async function listPayments(): Promise<AdminPayment[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("payment_requests")
    .select(
      `id,user_id,tier,amount,transaction_id,receipt_storage_path,status,submitted_at,reviewed_at,reviewer_id,reviewer_note,created_at,
       profiles ( display_name, email )`,
    )
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(500);

  if (error) throw new Error(`listPayments: ${error.message}`);
  return ((data ?? []) as unknown as PaymentJoinedRow[]).map((r) => {
    const userName =
      r.profiles?.display_name?.trim() ||
      r.profiles?.email.split("@")[0] ||
      "Unknown";
    return paymentToAdminPayment(r, userName);
  });
}

export async function getPaymentById(
  id: string,
): Promise<AdminPayment | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("payment_requests")
    .select(
      `id,user_id,tier,amount,transaction_id,receipt_storage_path,status,submitted_at,reviewed_at,reviewer_id,reviewer_note,created_at,
       profiles ( display_name, email )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getPaymentById: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as PaymentJoinedRow;
  const userName =
    row.profiles?.display_name?.trim() ||
    row.profiles?.email.split("@")[0] ||
    "Unknown";
  return paymentToAdminPayment(row, userName);
}

export async function listPaymentsByUserId(
  userId: string,
): Promise<AdminPayment[]> {
  const sb = getSupabaseAdmin();
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name,email")
    .eq("id", userId)
    .maybeSingle();
  const userName =
    profile?.display_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Unknown";

  const { data, error } = await sb
    .from("payment_requests")
    .select(
      "id,user_id,tier,amount,transaction_id,receipt_storage_path,status,submitted_at,reviewed_at,reviewer_id,reviewer_note,created_at",
    )
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`listPaymentsByUserId: ${error.message}`);
  return (data ?? []).map((r) =>
    paymentToAdminPayment(r as PaymentRequestRow, userName),
  );
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

interface SubscriptionJoinedRow extends SubscriptionRow {
  profiles: { display_name: string | null; email: string } | null;
}

export async function listSubscriptions(): Promise<AdminSubscription[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("subscriptions")
    .select(
      `id,user_id,tier,source,status,monthly_price,started_at,renews_at,canceled_at,
       profiles ( display_name, email )`,
    )
    .order("started_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(`listSubscriptions: ${error.message}`);
  return ((data ?? []) as unknown as SubscriptionJoinedRow[]).map((r) => {
    const userName =
      r.profiles?.display_name?.trim() ||
      r.profiles?.email.split("@")[0] ||
      "Unknown";
    return subscriptionToAdmin(r, userName);
  });
}

export async function listSubscriptionsByUserId(
  userId: string,
): Promise<AdminSubscription[]> {
  const sb = getSupabaseAdmin();
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name,email")
    .eq("id", userId)
    .maybeSingle();
  const userName =
    profile?.display_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Unknown";

  const { data, error } = await sb
    .from("subscriptions")
    .select(
      "id,user_id,tier,source,status,monthly_price,started_at,renews_at,canceled_at",
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error) throw new Error(`listSubscriptionsByUserId: ${error.message}`);
  return (data ?? []).map((r) =>
    subscriptionToAdmin(r as SubscriptionRow, userName),
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function dollarsFromPriceString(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export async function getDashboardSnapshotFromDb(): Promise<DashboardSnapshot> {
  const sb = getSupabaseAdmin();

  const [profilesRes, subsRes, paymentsRes] = await Promise.all([
    sb.from("profiles").select("id,tier,created_at"),
    sb
      .from("subscriptions")
      .select("monthly_price,status")
      .eq("status", "active"),
    sb.from("payment_requests").select("id").eq("status", "pending"),
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (subsRes.error)     throw new Error(subsRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);

  const profiles = profilesRes.data ?? [];
  const subs     = subsRes.data ?? [];
  const pending  = paymentsRes.data ?? [];

  // Tier breakdown
  const tierBreakdown = (
    ["Free", "Silver", "Gold"] as SubscriptionTier[]
  ).map((tier) => ({
    tier,
    count: profiles.filter((p) => TIER_TO_UI[p.tier as SubscriptionTierDb] === tier).length,
  }));

  // MRR: sum monthly_price of active subs
  const mrrDollars = subs.reduce(
    (acc, s) => acc + dollarsFromPriceString(s.monthly_price as string),
    0,
  );
  const mrr = `$${mrrDollars.toFixed(2)}`;

  // Weekly signups: count profiles created on each of the last 7 days
  const weeklySignups = buildWeeklySignups(
    profiles.map((p) => new Date(p.created_at as string)),
  );

  // New users this week = sum of weekly signups
  const newUsersThisWeek = weeklySignups.reduce((a, p) => a + p.value, 0);

  return {
    totalUsers: profiles.length,
    newUsersThisWeek,
    activeSubs: subs.length,
    pendingPayments: pending.length,
    mrr,
    weeklySignups,
    tierBreakdown,
  };
}

function buildWeeklySignups(dates: Date[]): SeriesPoint[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const buckets: SeriesPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const label = labels[(d.getDay() + 6) % 7]; // Mon=0..Sun=6
    const dayStart = new Date(d).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const value = dates.filter(
      (signup) => signup.getTime() >= dayStart && signup.getTime() < dayEnd,
    ).length;
    buckets.push({ label, value });
  }
  return buckets;
}

// Used by the sidebar pending-payments badge.
export async function getPendingPaymentsCount(): Promise<number> {
  const sb = getSupabaseAdmin();
  const { count, error } = await sb
    .from("payment_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw new Error(`getPendingPaymentsCount: ${error.message}`);
  return count ?? 0;
}
