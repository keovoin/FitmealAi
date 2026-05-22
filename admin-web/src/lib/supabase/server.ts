import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "server-only";

/**
 * Server-side Supabase client using the SERVICE ROLE key. This client
 * bypasses Row Level Security, so it MUST never be exposed to the browser.
 *
 * Required env vars (set in Vercel):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * If either is missing, we surface a clear error instead of silently
 * falling back to mock data.
 */

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Set it in Vercel env vars.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in Vercel env vars (Production env only).",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * True when both env vars are present. Use this to render a friendly
 * "connect Supabase" empty state instead of crashing during local dev
 * when env vars haven't been wired yet.
 */
export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL
    && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
