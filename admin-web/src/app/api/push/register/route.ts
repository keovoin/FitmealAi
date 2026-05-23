import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  user_id: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
  token: z.string().min(10),
});

/**
 * POST /api/push/register
 * Mobile clients call this after obtaining their APNs/FCM token.
 * Upserts into push_tokens so we can send notifications later.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { user_id, platform, token } = parsed.data;
  const sb = getSupabaseAdmin();

  const { error } = await sb
    .from("push_tokens")
    .upsert(
      { user_id, platform, token, updated_at: new Date().toISOString() },
      { onConflict: "user_id,token" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
