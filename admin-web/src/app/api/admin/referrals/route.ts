import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getReferralStats,
  listAllReferrals,
  listReferralCodes,
} from "@/lib/supabase/admin-referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/referrals
 *
 * Admin-only readout of every referral_codes row + every referrals row +
 * aggregate counts. Used as a JSON endpoint for off-page tools; the actual
 * /referrals page reads the same helpers directly server-side.
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  try {
    const [codes, referrals, stats] = await Promise.all([
      listReferralCodes(),
      listAllReferrals(),
      getReferralStats(),
    ]);
    return NextResponse.json({ codes, referrals, stats });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
