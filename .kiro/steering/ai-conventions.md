# AI service conventions (Phase 4b+)

Always:
- Validate model output with zod (`lib/ai/types.ts`) before any DB write. Models hallucinate; the schema is our last line of defense.
- Wrap text and image calls in `try/catch` and log a row to `ai_generations` with `succeeded=false` plus a short `error_code` even on failure, so we can see drift in the admin without enabling debug logs.
- Use `response_format: { type: "json_object" }` for structured generations and `gpt-4o-mini` for the cheap-tier default.
- Compute cost per call in `lib/ai/cost.ts` and write `cost_usd_micro` to `ai_generations` so the admin's MRR-vs-cost dashboard is accurate.
- Generate images at most once per unique meal title via `upsert_meal_by_slug`. Slug uses `slugify()` to normalize accents/punctuation.
- Cache hits get an `ai_generations` row with `cache_hit=true` AND `cost_usd_micro=0`. They do NOT count against the user's daily limit (this is enforced in `check_ai_rate_limit`).

Never:
- Trust a model to enforce dietary restrictions on its own. Validate ingredients against the user's allergy list server-side too (deferred to Phase 4c when we have rich profiles).
- Send the OpenAI key to the client. Use `lib/ai/openai.ts` which lives behind `import "server-only"`.
- Generate images for free-tier users that exceed the daily image budget. The global ceiling (`OPENAI_DAILY_BUDGET_USD`) catches this if rate limiting somehow doesn't.
- Skip rate-limit check before generation. The DB function is cheap; the OpenAI call isn't.

Cost ceilings (defaults; override per env):
- `OPENAI_DAILY_BUDGET_USD` = $5/day across all users globally. New requests get HTTP 503 once today's spend exceeds this.
- Per-tier daily cap (db-enforced): free 20, silver 50, gold 100.

Quality:
- Each meal must have at least 3 ingredients and at least 2 recipe steps (zod schema enforces this).
- Macro totals are validated by the model prompt (4 kcal/g protein+carbs, 9 kcal/g fat) but we don't yet validate them server-side. TODO: add a tolerance check in Phase 4c.
