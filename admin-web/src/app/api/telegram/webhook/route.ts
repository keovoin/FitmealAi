import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/telegram/webhook
 *
 * Receives updates from Telegram's Bot API. Set webhook via:
 *   https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook
 *
 * Supported commands:
 *   /start {link_code}  — Links Telegram chat to user account
 *   /meal              — Sends today's meal plan summary
 *   /water             — Sends a water reminder
 *   /status            — Shows subscription status + streak
 *   /unlink            — Unlinks Telegram from account
 *
 * Required env:
 *   - TELEGRAM_BOT_TOKEN
 */
export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: true }); // Acknowledge silently
  }

  const update = await req.json().catch(() => null);
  if (!update?.message?.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = update.message.chat.id;
  const text = (update.message.text as string).trim();
  const sb = getSupabaseAdmin();

  // /start {link_code} — link Telegram to user
  if (text.startsWith("/start ")) {
    const linkCode = text.replace("/start ", "").trim();
    if (!linkCode) {
      await sendMessage(botToken, chatId, "Please use the link from the FitMeal AI app to connect your account.");
      return NextResponse.json({ ok: true });
    }

    // link_code is the user_id for simplicity (in production, use a short-lived OTP)
    const { error } = await sb
      .from("notification_prefs")
      .upsert(
        { user_id: linkCode, telegram_linked: true, telegram_chat_id: String(chatId) },
        { onConflict: "user_id" },
      );

    if (error) {
      await sendMessage(botToken, chatId, "Failed to link account. Please try again from the app.");
    } else {
      await sendMessage(botToken, chatId, "Connected! You'll now receive FitMeal AI notifications here.\n\nCommands:\n/meal - Today's plan\n/water - Water reminder\n/status - Account status\n/unlink - Disconnect");
    }
    return NextResponse.json({ ok: true });
  }

  // Find user by chat_id
  const { data: prefs } = await sb
    .from("notification_prefs")
    .select("user_id")
    .eq("telegram_chat_id", String(chatId))
    .eq("telegram_linked", true)
    .maybeSingle();

  if (!prefs) {
    await sendMessage(botToken, chatId, "Your Telegram isn't linked to a FitMeal AI account yet. Open the app → Settings → Notifications → Link Telegram.");
    return NextResponse.json({ ok: true });
  }

  const userId = prefs.user_id;

  switch (text) {
    case "/meal": {
      const { data: plan } = await sb
        .from("meal_plans")
        .select("id,date,meals(title,calories,meal_type)")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        await sendMessage(botToken, chatId, "No meal plan found. Open the app and generate one!");
      } else {
        const meals = (plan.meals as { title: string; calories: number; meal_type: string }[]) ?? [];
        const lines = meals.map((m) => `• ${m.meal_type}: ${m.title} (${m.calories} kcal)`);
        const total = meals.reduce((a, m) => a + m.calories, 0);
        await sendMessage(botToken, chatId, `🍽 Today's Meal Plan\n\n${lines.join("\n")}\n\nTotal: ${total} kcal`);
      }
      break;
    }

    case "/water": {
      await sendMessage(botToken, chatId, "💧 Time to drink water!\n\nAim for 8 glasses (2L) today. Your body and your meal plan will thank you.");
      break;
    }

    case "/status": {
      const { data: profile } = await sb
        .from("profiles")
        .select("tier,display_name")
        .eq("id", userId)
        .maybeSingle();

      const tier = profile?.tier ?? "free";
      const name = profile?.display_name ?? "there";
      await sendMessage(botToken, chatId, `👋 Hi ${name}!\n\n📊 Plan: ${tier.charAt(0).toUpperCase() + tier.slice(1)}\n\nKeep going! 💪`);
      break;
    }

    case "/unlink": {
      await sb
        .from("notification_prefs")
        .update({ telegram_linked: false, telegram_chat_id: null })
        .eq("user_id", userId);
      await sendMessage(botToken, chatId, "Unlinked. You won't receive FitMeal AI notifications here anymore. You can re-link anytime from the app.");
      break;
    }

    default: {
      await sendMessage(botToken, chatId, "Available commands:\n/meal - Today's plan\n/water - Water reminder\n/status - Account status\n/unlink - Disconnect");
    }
  }

  return NextResponse.json({ ok: true });
}

async function sendMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}
