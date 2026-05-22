/**
 * Edge-runtime-safe auth constants.
 *
 * Middleware runs on the Vercel Edge runtime which does NOT have
 * Node's `crypto` or `Buffer`. So we keep these constants in a tiny
 * file with zero Node imports, and middleware imports from here
 * instead of from `auth.ts`.
 *
 * `auth.ts` itself uses Node `crypto` and only runs in the Node
 * runtime (Server Components and Route Handlers).
 */

export const ADMIN_COOKIE = "fitmeal_admin_session";
