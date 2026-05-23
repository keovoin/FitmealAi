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
 * If either is missing or malformed, we surface a clear error instead
 * of letting Node throw an opaque "Invalid URL" deep inside the
 * Supabase client.
 */

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Set it in Vercel env vars (must look like https://your-project-ref.supabase.co).",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in Vercel env vars (Production env only).",
    );
  }

  const url = normalizeSupabaseUrl(rawUrl);
  if (!url) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is malformed: ${JSON.stringify(rawUrl)}. ` +
        "It must be a full URL like https://your-project-ref.supabase.co " +
        "(no trailing slash, no whitespace).",
    );
  }

  cached = createClient(url, serviceRoleKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * True when both env vars are present AND the URL parses. Use this to
 * render a friendly "connect Supabase" empty state instead of crashing
 * during local dev when env vars haven't been wired yet.
 */
export function isSupabaseConfigured(): boolean {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) !== null;
}

/**
 * Forgiving URL normalizer. Accepts:
 *   - "https://abc.supabase.co"
 *   - "https://abc.supabase.co/"
 *   - "  https://abc.supabase.co  "    (trims whitespace)
 *   - "abc.supabase.co"                 (adds https:// prefix)
 *   - "http://abc.supabase.co"          (upgrades to https)
 *
 * Returns null when nothing usable can be parsed.
 */
function normalizeSupabaseUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Strip surrounding quotes if the env was pasted with them.
  const dequoted = trimmed.replace(/^['"]|['"]$/g, "").trim();
  if (!dequoted) return null;

  // Add https:// if the user pasted just the hostname.
  const withProtocol = /^https?:\/\//i.test(dequoted)
    ? dequoted
    : `https://${dequoted}`;

  try {
    const u = new URL(withProtocol);
    // Force https - service-role traffic must never go over plaintext.
    u.protocol = "https:";
    // Drop trailing slash so downstream string concat doesn't double up.
    return u.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}
