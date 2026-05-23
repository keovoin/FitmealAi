import "server-only";
import { getSupabaseAdmin } from "./server";

/**
 * Admin-side queries for the referral system. The user-facing /api/referrals
 * routes only return per-user data (anti-abuse: the referrer can't enumerate
 * other users). The /referrals admin page wants the full picture: every
 * referral_codes row joined with the latest counts of pending/verified/
 * rewarded referrals.
 */

export type ReferralStatus = "pending" | "verified" | "rewarded" | "rejected";

export interface AdminReferralCode {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  code: string;
  createdAt: string;
  pending: number;
  verified: number;
  rewarded: number;
}

export interface AdminReferral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  deviceFingerprint: string | null;
  status: ReferralStatus;
  createdAt: string;
  verifiedAt: string | null;
}

export interface AdminReferralStats {
  totalCodes: number;
  totalReferrals: number;
  pending: number;
  verified: number;
  rewarded: number;
  rejected: number;
}

interface ProfileLite {
  display_name: string | null;
  email: string;
}

interface ReferralCodeRow {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  device_fingerprint: string | null;
  status: ReferralStatus;
  created_at: string;
  verified_at: string | null;
}

function userLabel(profile: ProfileLite | null | undefined, fallbackId: string): string {
  if (!profile) return fallbackId.slice(0, 8);
  return (
    profile.display_name?.trim() ||
    profile.email?.split("@")[0] ||
    fallbackId.slice(0, 8)
  );
}

export async function listReferralCodes(): Promise<AdminReferralCode[]> {
  const sb = getSupabaseAdmin();

  // 1. Pull every referral_codes row. We CANNOT use PostgREST's embedded
  //    select (`profiles ( display_name, email )`) here because
  //    referral_codes.user_id is FK to `auth.users(id)`, not `profiles(id)`,
  //    and PostgREST won't traverse that two-hop relationship -- it errors
  //    with "Could not find a relationship between 'referral_codes' and
  //    'profiles' in the schema cache."
  const { data: codes, error } = await sb
    .from("referral_codes")
    .select("id,user_id,code,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`listReferralCodes: ${error.message}`);

  // 2. Pull every referral so we can compute counts in-memory.
  const { data: refs, error: refErr } = await sb
    .from("referrals")
    .select("referrer_id,status");
  if (refErr) throw new Error(`listReferralCodes counts: ${refErr.message}`);

  const counts = new Map<string, { pending: number; verified: number; rewarded: number }>();
  for (const r of (refs ?? []) as { referrer_id: string; status: ReferralStatus }[]) {
    const slot = counts.get(r.referrer_id) ?? { pending: 0, verified: 0, rewarded: 0 };
    if (r.status === "pending") slot.pending += 1;
    else if (r.status === "verified") slot.verified += 1;
    else if (r.status === "rewarded") slot.rewarded += 1;
    counts.set(r.referrer_id, slot);
  }

  // 3. Resolve display_name/email by id in a single round-trip.
  const codeRows = (codes ?? []) as ReferralCodeRow[];
  const ids = Array.from(new Set(codeRows.map((r) => r.user_id)));
  const profilesById = await fetchProfilesById(ids);

  return codeRows.map((row) => {
    const c = counts.get(row.user_id) ?? { pending: 0, verified: 0, rewarded: 0 };
    const profile = profilesById.get(row.user_id) ?? null;
    return {
      id: row.id,
      userId: row.user_id,
      userName: userLabel(profile, row.user_id),
      userEmail: profile?.email ?? "",
      code: row.code,
      createdAt: row.created_at,
      pending: c.pending,
      verified: c.verified,
      rewarded: c.rewarded,
    };
  });
}

/**
 * Batch profile lookup. Returns a map keyed by `profiles.id`. Empty
 * map when there are no ids or the profiles table is missing/empty.
 */
async function fetchProfilesById(ids: string[]): Promise<Map<string, ProfileLite>> {
  if (ids.length === 0) return new Map();
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("profiles")
    .select("id,display_name,email")
    .in("id", ids);
  if (error) throw new Error(`fetchProfilesById: ${error.message}`);
  return new Map<string, ProfileLite>(
    (data ?? []).map(
      (p: { id: string; display_name: string | null; email: string }) => [
        p.id,
        { display_name: p.display_name, email: p.email },
      ],
    ),
  );
}

export async function listAllReferrals(): Promise<AdminReferral[]> {
  const sb = getSupabaseAdmin();

  const { data, error } = await sb
    .from("referrals")
    .select(
      "id,referrer_id,referred_id,device_fingerprint,status,created_at,verified_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`listAllReferrals: ${error.message}`);

  const refs = (data ?? []) as ReferralRow[];
  if (refs.length === 0) return [];

  // Resolve names in one round-trip.
  const ids = Array.from(
    new Set([...refs.map((r) => r.referrer_id), ...refs.map((r) => r.referred_id)]),
  );
  const { data: profiles, error: profErr } = await sb
    .from("profiles")
    .select("id,display_name,email")
    .in("id", ids);
  if (profErr) throw new Error(`listAllReferrals profiles: ${profErr.message}`);

  const byId = new Map<string, ProfileLite>(
    (profiles ?? []).map((p: { id: string; display_name: string | null; email: string }) => [
      p.id,
      { display_name: p.display_name, email: p.email },
    ]),
  );

  return refs.map((r) => ({
    id: r.id,
    referrerId: r.referrer_id,
    referrerName: userLabel(byId.get(r.referrer_id) ?? null, r.referrer_id),
    referredId: r.referred_id,
    referredName: userLabel(byId.get(r.referred_id) ?? null, r.referred_id),
    deviceFingerprint: r.device_fingerprint,
    status: r.status,
    createdAt: r.created_at,
    verifiedAt: r.verified_at,
  }));
}

export async function getReferralStats(): Promise<AdminReferralStats> {
  const sb = getSupabaseAdmin();

  const [{ count: codeCount }, { data: refs, error }] = await Promise.all([
    sb.from("referral_codes").select("id", { count: "exact", head: true }),
    sb.from("referrals").select("status"),
  ]);
  if (error) throw new Error(`getReferralStats: ${error.message}`);

  const stats: AdminReferralStats = {
    totalCodes: codeCount ?? 0,
    totalReferrals: refs?.length ?? 0,
    pending: 0,
    verified: 0,
    rewarded: 0,
    rejected: 0,
  };
  for (const r of (refs ?? []) as { status: ReferralStatus }[]) {
    if (r.status in stats) {
      (stats as unknown as Record<string, number>)[r.status] += 1;
    }
  }
  return stats;
}
