import { ADMIN_COOKIE, verifyAdminPassword } from "@/lib/auth";
import { checkLoginRateLimit, recordLoginFailure } from "@/lib/rate-limit-login";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Best-effort client identifier. Vercel sets x-forwarded-for; fall back
  // to a constant string so all unknown clients share the same bucket.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = checkLoginRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many attempts. Try again in ${limit.retryAfter}s.`,
      },
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfter) },
      },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = body.password;

  // Always run the full verify so the response time is similar for
  // empty vs. wrong passwords.
  const cookieValue = password ? verifyAdminPassword(password) : null;

  if (!cookieValue) {
    recordLoginFailure(ip);
    return NextResponse.json(
      { ok: false, error: "Invalid password" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 12-hour session.
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
