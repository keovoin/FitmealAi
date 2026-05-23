import { NextResponse, type NextRequest } from "next/server";
// IMPORTANT: middleware runs on the Edge runtime; never import from
// "@/lib/auth" here because that module pulls in Node's `crypto`. Use
// the small constants file instead.
import { ADMIN_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/api/logout",
  // Mobile/API routes validate Supabase JWTs in their own handlers.
  // Adding them to PUBLIC_PATHS here lets the iOS/Android apps call
  // them without an admin cookie. Each route still 503s if Supabase
  // isn't configured and validates its own zod body.
  "/api/ai/meal-plan",
  "/api/mobile-config",
  "/api/payments/options",
  "/api/payments/create-khqr",
  "/api/payments/status",
  "/api/push/register",
  "/api/referrals",
  "/api/notifications/prefs",
  // Phase 5 mobile-facing endpoints (catalog shuffle + quota readout).
  "/api/quotas",
  "/api/recipes/shuffle",
  // Telegram webhook is called by Telegram's servers, not the app.
  "/api/telegram/webhook",
];

/**
 * Cheap presence check at the edge. The layout in app/(admin)/layout.tsx
 * runs the real constant-time hash comparison via isAuthenticated() and
 * will redirect to /login if the cookie is stale or invalid.
 *
 * We deliberately don't validate the cookie value here because:
 *   - Middleware runs on the Edge runtime which doesn't expose Node's
 *     `crypto.timingSafeEqual` reliably
 *   - We want the same secret material in one place (lib/auth.ts)
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const session = req.cookies.get(ADMIN_COOKIE)?.value;
  if (session && session.length > 0) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on every page route except Next internals and public assets.
  matcher: ["/((?!_next/|favicon.ico|.*\\..*).*)"],
};
