import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./server";
import {
  AI_PROVIDER_KEYS,
  DEFAULT_AI_PROVIDER,
  isAIProviderId,
  type AIProviderSettings,
} from "./ai-provider-shared";

// Re-export the isomorphic surface so existing server-side imports
// of `./ai-provider` keep working unchanged. Client code MUST import
// from `./ai-provider-shared` (this module pulls in `server-only`).
export * from "./ai-provider-shared";

/**
 * Read the active AI provider choice. Falls back to "openai" when the
 * row is missing (e.g. before migration 0018 has been applied) so AI
 * calls keep working out of the box.
 */
export async function getAIProviderSettings(): Promise<AIProviderSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_AI_PROVIDER;
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("app_settings")
      .select("value")
      .eq("key", AI_PROVIDER_KEYS.active)
      .maybeSingle();
    if (error || !data) return DEFAULT_AI_PROVIDER;
    const value = data.value;
    if (isAIProviderId(value)) {
      return { active: value };
    }
    return DEFAULT_AI_PROVIDER;
  } catch {
    return DEFAULT_AI_PROVIDER;
  }
}

/**
 * Persist a new AI provider choice. Service-role only (mounted by the
 * admin server action `updateAIProviderSettings`).
 */
export async function setAIProviderSettings(value: AIProviderSettings): Promise<void> {
  if (!isAIProviderId(value.active)) {
    throw new Error(`Invalid AI provider id: ${String(value.active)}`);
  }
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("app_settings").upsert(
    {
      key: AI_PROVIDER_KEYS.active,
      value: value.active as unknown as object,
      description:
        'Which provider serves AI requests. One of "openai" or "custom".',
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
}
