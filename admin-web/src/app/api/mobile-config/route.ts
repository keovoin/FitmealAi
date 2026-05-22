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
      FITMEAL_GOOGLE_IOS_CLIENT_ID: "manual_google_ios_client_id",
      FITMEAL_GOOGLE_REVERSED_CLIENT_ID: "manual_google_reversed_client_id",
      FITMEAL_GOOGLE_SERVER_CLIENT_ID: "manual_google_server_client_id",
    },
  });
}