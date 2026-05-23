/**
 * Isomorphic types + defaults for the admin-tunable AI provider choice.
 *
 * Mirrors the pattern used by `quota-settings-shared.ts`: this file
 * has no `server-only` import so it can be consumed by both the Next
 * server (admin-actions, /ai-settings page) and any future client
 * component that needs to render the same options.
 */

/**
 * Identifier of the active AI provider. The admin selects between
 * these in /ai-settings; the runtime reads the row from app_settings
 * on every AI call.
 *
 *   - "openai":  use the OpenAI cloud (OPENAI_* env vars)
 *   - "custom":  use a self-hosted OpenAI-compatible endpoint
 *                (CUSTOM_AI_* env vars)
 *   - "kiro":    use the Kiro AI gateway (an OpenAI-compatible
 *                endpoint maintained by the Kiro team), configured
 *                via KIRO_AI_* env vars. Behaves identically to
 *                "custom" — separate ID so admins can swap between
 *                a self-hosted endpoint AND Kiro without re-editing
 *                env vars on every flip.
 */
export type AIProviderId = "openai" | "custom" | "kiro";

export const AI_PROVIDER_KEYS = {
  /** Selected provider for text/chat completions and image generation. */
  active: "ai_provider.text",
} as const;

export interface AIProviderSettings {
  active: AIProviderId;
}

export const DEFAULT_AI_PROVIDER: AIProviderSettings = {
  active: "openai",
};

export function isAIProviderId(value: unknown): value is AIProviderId {
  return value === "openai" || value === "custom" || value === "kiro";
}

/**
 * Result of a "test connection" probe against an AI provider, returned
 * by the `testAIProviderAction` server action and consumed by the
 * /ai-settings form. Defined here (in the shared module) instead of
 * alongside the action because the action's file carries a top-level
 * `"use server"` directive — Next.js requires every export from such
 * a file to be an async function.
 */
export type TestAIProviderResult =
  | { ok: true; modelCount: number; sampleModels: string[] }
  | { ok: false; error: string };
