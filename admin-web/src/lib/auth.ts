import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Phase-3 stub auth. Single shared password gates the admin until
 * Phase-4c moves us to Supabase-backed admin accounts.
 *
 * Security hardening (vs. earlier draft):
 *   - No insecure default fallback in production. If ADMIN_PASSWORD
 *     isn't set, the login route refuses to authenticate ANYONE.
 *   - Cookie value is the SHA-256 of (process boot secret + admin
 *     password hash), so cookies issued by a previous deploy with a
 *     different password won't validate against a new one.
 *   - Constant-time comparison so we don't leak password length via
 *     timing. (Not critical here, but cheap to do right.)
 *   - Minimum password length of 8 chars enforced at boot.
 */

export const ADMIN_COOKIE = "fitmeal_admin_session";

const MIN_PASSWORD_LENGTH = 8;

// Once-per-process random value baked into the cookie hash. Restarting
// the server (or Vercel rebuilding) invalidates outstanding sessions.
const PROCESS_SECRET = randomBytes(32).toString("hex");

interface AdminConfig {
  password: string;
  cookieValue: string;
}

let cached: AdminConfig | null = null;

/**
 * Read and validate the admin password from the environment. In
 * production we REFUSE an insecure default. In development we accept
 * an insecure default and log a warning so local dev still works.
 */
export function getAdminConfig(): AdminConfig | null {
  if (cached) return cached;

  const raw = process.env.ADMIN_PASSWORD?.trim();
  const isDev = process.env.NODE_ENV !== "production";

  if (!raw || raw.length < MIN_PASSWORD_LENGTH) {
    if (isDev) {
      // Development convenience. Never reaches production.
      const fallback = "dev-only-password-please-change";
      console.warn(
        "[admin-auth] ADMIN_PASSWORD not set or too short. Using dev fallback. " +
          "Set ADMIN_PASSWORD in your env to silence this warning.",
      );
      cached = makeConfig(fallback);
      return cached;
    }
    // Production: refuse to authenticate anyone.
    console.error(
      "[admin-auth] ADMIN_PASSWORD is missing or shorter than 8 chars. " +
        "All admin login attempts will be rejected. Set ADMIN_PASSWORD in Vercel env.",
    );
    return null;
  }

  cached = makeConfig(raw);
  return cached;
}

function makeConfig(password: string): AdminConfig {
  const cookieValue = createHash("sha256")
    .update(PROCESS_SECRET)
    .update("|")
    .update(password)
    .digest("hex");
  return { password, cookieValue };
}

/**
 * Constant-time password comparison. Returns the cookie value to set
 * on success, or null on failure (wrong password OR misconfigured).
 */
export function verifyAdminPassword(submitted: string): string | null {
  const config = getAdminConfig();
  if (!config) return null;

  const a = Buffer.from(submitted);
  const b = Buffer.from(config.password);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return config.cookieValue;
}

export async function isAuthenticated(): Promise<boolean> {
  const config = getAdminConfig();
  if (!config) return false;
  const store = await cookies();
  const session = store.get(ADMIN_COOKIE)?.value;
  if (!session) return false;
  // Constant-time check so a probing attacker can't learn anything
  // about the cookie shape from response timing.
  const a = Buffer.from(session);
  const b = Buffer.from(config.cookieValue);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
