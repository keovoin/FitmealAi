# Security conventions

This file captures non-obvious rules to avoid leaking secrets or PII.

Always:
- Treat anything in `process.env` that isn't prefixed with `NEXT_PUBLIC_` as **server-only**. Never import it into a client component, even indirectly via a re-exported helper.
- Use `import "server-only"` at the top of any module that uses `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or any other server-only env var. The Next.js compiler will refuse to bundle it for the client and surface a clear error if someone tries.
- Use constant-time comparison (`crypto.timingSafeEqual`) when comparing secrets, even for low-stakes checks.
- Validate every external input with `zod` before passing it to the database or to OpenAI. Free-form strings flow through too much of our system to be cheap.
- For new env vars, add them to `admin-web/.env.example` with a placeholder value (never the real one).

Never:
- Commit `.env`, `.env.local`, `.env.production`, or any file that ends with a real key. The `.gitignore` excludes them but be deliberate.
- Hardcode an "insecure default" that a production deploy would silently fall back to. (We learned this with the old `"fitmeal-admin"` default.) If a required env var is missing in production, the code should refuse to authenticate or return a clear 503.
- Echo a user's input back into a server log without scrubbing. `console.log(req.body)` can leak passwords if you're not careful.
- Embed real PII in seed data, fixtures, or tests. Use RFC-2606 reserved domains (`example.com`, `example.org`) and fake placeholder phone numbers (`+855 12 345 678`).
- Return raw OpenAI errors to the client. Map them to short codes (`openai_text_failed`, `quota_exceeded`) so we don't leak prompt fragments or model names.

Defense in depth:
- Admin login has an in-memory rate limiter (`lib/rate-limit-login.ts`): 8 failures in 10 min => 15 min lockout. Phase-4c moves this into Supabase so locks survive cold starts.
- The admin session cookie value is `sha256(PROCESS_SECRET || ADMIN_PASSWORD)`, so cookies issued before a password rotation stop validating after the next deploy.
- The AI meal-plan endpoint enforces a per-user daily cap AND a global daily USD cap (`OPENAI_DAILY_BUDGET_USD`). The DB function is the source of truth on per-user limits; the API just calls it.
- Storage bucket `receipts` is private; URLs only resolve via service role. `meal-images` is public but writable only by service role.
