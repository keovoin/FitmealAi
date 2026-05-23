-- =============================================================================
-- 0018_ai_provider_setting.sql
-- Admin-tunable choice between OpenAI and a self-hosted/custom OpenAI-
-- compatible LLM endpoint. The actual base URL + API key live in env
-- vars (CUSTOM_AI_BASE_URL, CUSTOM_AI_API_KEY, etc.) — only the
-- "which one is active" flag lives in app_settings so the admin can
-- flip it without redeploying.
--
-- Read by `resolveActiveAIProvider()` in admin-web on every AI call.
--
-- Idempotent on re-run.
-- =============================================================================

insert into public.app_settings(key, value, description) values
  (
    'ai_provider.text',
    '"openai"'::jsonb,
    'Which provider serves /api/ai/meal-plan and admin "Generate with AI" requests. One of "openai" or "custom". The custom endpoint must be OpenAI-compatible (chat/completions, optional images/generations) and is configured through the CUSTOM_AI_* env vars.'
  )
on conflict (key) do nothing;
