# Supabase backend

Source of truth for users, plans, payments, and AI usage. Hosted in **ap-southeast-2 (Sydney)**.

## Schema

SQL migrations live at `supabase/migrations/0001_*.sql` through `0011_*.sql`. Each file is **idempotent** so re-running is safe. Apply via Supabase SQL Editor or the CLI; see `supabase/README.md`.

Always:
- Use enum types (`subscription_tier`, `payment_status`, etc.) instead of free-form text
- Add `updated_at` + `touch_updated_at` trigger to any mutable user-owned table
- Add Row Level Security and a `self all` policy whenever a new user-owned table is added
- For shared lookups (like `meals`), allow `select` to all authenticated users; restrict writes to service role
- Keep ai_generations.cache_hit accurate - cache hits never count against rate limits

Never:
- Bypass RLS by querying with the anon key from the client
- Embed the service role key in client-bundled code (only `src/lib/supabase/server.ts` may import it)
- Add a column without a default if existing rows would violate it on a hot prod database
- Forget to update `supabase/README.md` when adding a new migration

## Rate limits (per the product spec)

Lives in `check_ai_rate_limit(user_id, kind)` in migration 0008.

| Tier | Behavior |
|---|---|
| Free | 3 immediate, then 1 every 30 min, daily cap 20 |
| Silver | 50/day |
| Gold | 100/day |

Rows where `cache_hit = true` do NOT count against these caps because no AI call actually happened.

## Meal cache

`upsert_meal_by_slug(...)` de-duplicates AI-generated meals by normalized title. First time a meal is seen, the API generates an image and stores it in the public `meal-images` bucket. Subsequent users with the same meal title reuse the cached row and image. This keeps image-generation cost roughly constant regardless of user count.

## Storage

- `meal-images` bucket: public read, service-role write only
- `receipts` bucket: per-user write to `<user_id>/...`, service-role read for admin

## Env vars (all set in Vercel)

- `NEXT_PUBLIC_SUPABASE_URL` - public
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - public, used by iOS app once wired
- `SUPABASE_SERVICE_ROLE_KEY` - **server-only**, never sent to client. Only `admin-web/src/lib/supabase/server.ts` imports it.
