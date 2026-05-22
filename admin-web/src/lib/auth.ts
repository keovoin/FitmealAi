import { cookies } from "next/headers";

/**
 * Phase-3 stub auth. We accept ONE shared password set via env var so the
 * admin can be opened on Vercel by a single human. Phase-4 will replace
 * this with a real auth provider (NextAuth / Clerk / Supabase).
 */

export const ADMIN_COOKIE = "fitmeal_admin_session";
export const ADMIN_COOKIE_VALUE = "ok";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "fitmeal-admin";
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === ADMIN_COOKIE_VALUE;
}
