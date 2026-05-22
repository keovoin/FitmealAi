# Supabase database

This folder holds the SQL migrations for FitMeal AI. We use plain numbered `.sql` files (no Supabase CLI required) so you can apply them straight from the Supabase Dashboard SQL editor.

## How to apply migrations

Each file is **idempotent** — running it twice is safe. If you ever need to wipe and start over, you can re-run them all in order.

### Easiest path: SQL Editor in Supabase Dashboard

1. Open https://app.supabase.com → your project → **SQL Editor**
2. Click **New query**
3. Open `supabase/migrations/0001_extensions_and_enums.sql` from GitHub, copy the contents, paste into the editor, click **Run**
4. Repeat for `0002_*` through `0011_*` in order

That's the whole thing. About 30 seconds of clicking.

### Alternative: Supabase CLI

If you want to use the CLI later, all these files follow Supabase migration naming so you can drop them in `supabase/migrations/` and run `supabase db push`.

## What each migration does

| File | What it creates |
|---|---|
| `0001_extensions_and_enums.sql` | `uuid-ossp`, `pgcrypto`, `citext` extensions and shared enum types |
| `0002_profiles.sql` | `profiles` table mirroring `auth.users`, plus a trigger that auto-creates a profile on signup |
| `0003_user_goals_and_prefs.sql` | `user_goals`, `meal_prefs`, `workout_prefs` |
| `0004_meals_and_meal_plans.sql` | Shared `meals` lookup (cached AI results), `meal_plans`, `meal_plan_items` |
| `0005_workout_plans.sql` | `workout_plans`, `exercises` |
| `0006_habits_and_logs.sql` | `habits`, `habit_logs` (one row per habit per day), `v_habit_streaks` view |
| `0007_subscriptions_and_payments.sql` | `subscriptions`, `payment_requests`, trigger that promotes user tier on payment approval |
| `0008_ai_generations_and_rate_limits.sql` | `ai_generations` log + `check_ai_rate_limit()` enforcing per-tier caps + `upsert_meal_by_slug()` for the meal cache |
| `0009_rls_policies.sql` | Row Level Security so users only see their own data |
| `0010_storage_policies.sql` | `meal-images` (public) and `receipts` (private) buckets + policies |
| `0011_seed_admin_demo_data.sql` | Optional: 3 sample meals matching iOS MockData |

## Rate limit rules baked into 0008

Configured per the product spec:

| Tier | Rule |
|---|---|
| **Free** | 3 immediate, then 1 per 30 min, daily cap **20** |
| **Silver** | Daily cap **50** |
| **Gold** | Daily cap **100** |

`check_ai_rate_limit(user_id, kind)` returns `(allowed, reason, retry_after_seconds, daily_used, daily_limit)` so the API can return a clean 429 with a retry hint. Rows where `cache_hit = true` don't count toward the limit, since no AI call actually happened.

## How the meal-image cache works

When the AI generates a meal, we compute a normalized `slug` from the title (e.g. `"Greek Yogurt Bowl"` -> `greek-yogurt-bowl`).

`upsert_meal_by_slug(...)` looks up the slug:

- **Found** -> returns the existing meal with its already-generated image. We log an `ai_generations` row with `cache_hit = true` so it's free.
- **Missing** -> inserts a new `meals` row, returns `was_inserted = true`, and the API enqueues an image-generation job.

End result: each unique meal title costs ONE image generation, ever.
