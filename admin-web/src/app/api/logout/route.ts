import { ADMIN_COOKIE } from "@/lib/auth";
import { NextResponse } from "next/server";

// Pin to Node runtime for symmetry with the login handler.
export const runtime = "nodejs";

function clearAndRedirect(req: Request) {
  const url = new URL("/login", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: Request) {
  return clearAndRedirect(req);
}

export async function POST(req: Request) {
  return clearAndRedirect(req);
}
