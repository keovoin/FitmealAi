import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout"];

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
