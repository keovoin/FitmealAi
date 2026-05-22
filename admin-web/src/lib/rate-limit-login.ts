/**
 * Tiny in-memory brute-force protection for the admin login route.
 *
 * Rules:
 *   - 8 failed attempts within 10 minutes locks the IP for 15 minutes
 *   - Successful login clears the counter
 *   - State is per-process; a Vercel cold start resets it (acceptable
 *     because the underlying password is also rotated server-side via
 *     PROCESS_SECRET in lib/auth.ts)
 *
 * For Phase-4c we'll move this into Supabase so locks survive restarts
 * and span all serverless instances.
 */

interface Bucket {
  failures: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const WINDOW_MS = 10 * 60 * 1000; // 10 min
const MAX_FAILURES = 8;
const LOCK_MS = 15 * 60 * 1000; // 15 min

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

function getOrCreate(ip: string): Bucket {
  const existing = buckets.get(ip);
  if (existing) return existing;
  const fresh: Bucket = { failures: 0, firstAttemptAt: now(), lockedUntil: 0 };
  buckets.set(ip, fresh);
  return fresh;
}

export function checkLoginRateLimit(
  ip: string,
): { ok: true } | { ok: false; retryAfter: number } {
  const bucket = getOrCreate(ip);
  const t = now();

  if (bucket.lockedUntil > t) {
    return { ok: false, retryAfter: Math.ceil((bucket.lockedUntil - t) / 1000) };
  }

  // Drop expired window so legitimate users aren't penalized forever
  if (t - bucket.firstAttemptAt > WINDOW_MS) {
    bucket.failures = 0;
    bucket.firstAttemptAt = t;
  }
  return { ok: true };
}

export function recordLoginFailure(ip: string) {
  const bucket = getOrCreate(ip);
  const t = now();
  if (t - bucket.firstAttemptAt > WINDOW_MS) {
    bucket.failures = 0;
    bucket.firstAttemptAt = t;
  }
  bucket.failures += 1;
  if (bucket.failures >= MAX_FAILURES) {
    bucket.lockedUntil = t + LOCK_MS;
  }
}

export function recordLoginSuccess(ip: string) {
  buckets.delete(ip);
}
