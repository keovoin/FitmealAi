import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    supabase_url_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_anon_key_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    api_base_url: process.env.NEXT_PUBLIC_APP_URL ?? null,
    ios_info_plist_keys: {
      FITMEAL_SUPABASE_URL: "NEXT_PUBLIC_SUPABASE_URL",
      FITMEAL_SUPABASE_ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      FITMEAL_API_BASE_URL: "NEXT_PUBLIC_APP_URL",
    },
  });
}