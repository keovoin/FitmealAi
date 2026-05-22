import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE, getAdminPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };
  if (!password || password !== getAdminPassword()) {
    return NextResponse.json(
      { ok: false, error: "Invalid password" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 12-hour session.
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
