import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const session = req.cookies.get(ADMIN_COOKIE)?.value;
  if (session === ADMIN_COOKIE_VALUE) {
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
