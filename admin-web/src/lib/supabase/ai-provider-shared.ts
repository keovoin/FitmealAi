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
 */
export type AIProviderId = "openai" | "custom";

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
  return value === "openai" || value === "custom";
}
