import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  user_id: z.string().min(1),
  message: z.string().min(1).max(2000),
});

/**
 * POST /api/telegram/send
 * Server-side endpoint to push a message to a user's linked Telegram.
 * Used by cron jobs / triggers to send meal plan notifications,
 * water reminders, payment confirmations, etc.
 */
export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { user_id, message } = parsed.data;
  const sb = getSupabaseAdmin();

  const { data: prefs } = await sb
    .from("notification_prefs")
    .select("telegram_chat_id,telegram_linked")
    .eq("user_id", user_id)
    .maybeSingle();

  if (!prefs?.telegram_linked || !prefs?.telegram_chat_id) {
    return NextResponse.json({ error: "not_linked", sent: false });
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: prefs.telegram_chat_id,
      text: message,
      parse_mode: "HTML",
    }),
  });

  const ok = res.ok;
  return NextResponse.json({ ok, sent: ok });
}
