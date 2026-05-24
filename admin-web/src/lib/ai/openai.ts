import "server-only";
import OpenAI from "openai";
import { getAIProviderSettings, type AIProviderId } from "@/lib/supabase/ai-provider";

/**
 * Resolve which AI provider to use on each request, based on the
 * `ai_provider.text` row in `app_settings`. Three providers are
 * supported:
 *
 *   - "openai" — the OpenAI cloud, configured via `OPENAI_*` env vars
 *   - "custom" — any OpenAI-compatible endpoint (vLLM, Together,
 *                Anyscale, Ollama with the OpenAI compat layer, your
 *                own self-hosted build), configured via `CUSTOM_AI_*`
 *   - "kiro"   — the Kiro AI gateway (also OpenAI-compatible), kept
 *                as a separate slot so admins can have BOTH a
 *                self-hosted endpoint AND Kiro configured at once and
 *                flip between them without re-editing env vars.
 *                Configured via `KIRO_AI_*`.
 *
 * The admin flips between them in /ai-settings without a redeploy. The
 * actual base URL + API key live in env vars on Vercel; the
 * `app_settings` row only holds the active choice.
 *
 * Existing call sites (`meal-plan-service.ts`, `recipe-generator.ts`)
 * call `resolveActiveAIProvider()` once per request and re-use the
 * resolved client/model bundle for both the text and image legs.
 */

export type { AIProviderId };

export interface ResolvedAIProvider {
  id: AIProviderId;
  /** OpenAI SDK client, baseURL-overridden when `id === "custom"`. */
  client: OpenAI;
  /** Model name to pass to `chat.completions.create({ model })`. */
  textModel: string;
  /**
   * Model name for `images.generate({ model })`. `null` when the
   * active provider is custom and `CUSTOM_AI_IMAGE_MODEL` was left
   * blank — meal-plan-service / recipe-generator skip image generation
   * in that case and surface a warning.
   */
  imageModel: string | null;
  /** Convenience: equivalent to `imageModel !== null`. */
  supportsImages: boolean;
}

export interface ProviderEnvStatus {
  openai: { hasApiKey: boolean };
  custom: {
    hasBaseUrl: boolean;
    hasApiKey: boolean;
    hasTextModel: boolean;
    hasImageModel: boolean;
  };
  kiro: {
    hasBaseUrl: boolean;
    hasApiKey: boolean;
    hasTextModel: boolean;
    hasImageModel: boolean;
  };
}

export class AIProviderConfigError extends Error {
  constructor(
    message: string,
    readonly providerId: AIProviderId,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

/**
 * Read the admin's selection from `app_settings` and build a fully
 * configured client. Throws `AIProviderConfigError` when the selected
 * provider's env vars aren't set so callers can return a clean 503.
 */
export async function resolveActiveAIProvider(): Promise<ResolvedAIProvider> {
  const settings = await getAIProviderSettings();
  return resolveProviderById(settings.active);
}

/**
 * Build a client for an explicit provider id. Useful for the admin's
 * "test connection" button which needs to probe a specific provider
 * regardless of which one is currently active.
 */
export function resolveProviderById(id: AIProviderId): ResolvedAIProvider {
  if (id === "custom") {
    return resolveCustomProvider();
  }
  if (id === "kiro") {
    return resolveKiroProvider();
  }
  return resolveOpenAIProvider();
}

/**
 * `true` when at least ONE provider is fully configured. Used by
 * `/api/ai/meal-plan` to short-circuit with 503 before consulting
 * `app_settings`.
 */
export function isAIConfigured(): boolean {
  return hasOpenAIEnv() || hasCustomEnv() || hasKiroEnv();
}

/**
 * Snapshot of which env vars are populated, for rendering the
 * admin's /ai-settings page status indicators.
 */
export function getProviderEnvStatus(): ProviderEnvStatus {
  return {
    openai: { hasApiKey: hasOpenAIEnv() },
    custom: {
      hasBaseUrl: !!process.env.CUSTOM_AI_BASE_URL?.trim(),
      hasApiKey: !!process.env.CUSTOM_AI_API_KEY?.trim(),
      hasTextModel: !!process.env.CUSTOM_AI_TEXT_MODEL?.trim(),
      hasImageModel: !!process.env.CUSTOM_AI_IMAGE_MODEL?.trim(),
    },
    kiro: {
      hasBaseUrl: !!process.env.KIRO_AI_BASE_URL?.trim(),
      hasApiKey: !!process.env.KIRO_AI_API_KEY?.trim(),
      hasTextModel: !!process.env.KIRO_AI_TEXT_MODEL?.trim(),
      hasImageModel: !!process.env.KIRO_AI_IMAGE_MODEL?.trim(),
    },
  };
}

export interface DailyBudget {
  /** Hard ceiling in USD per day across all users. */
  ceilingUsd: number;
}

export function getDailyBudget(): DailyBudget {
  const raw = Number(process.env.OPENAI_DAILY_BUDGET_USD);
  return { ceilingUsd: Number.isFinite(raw) && raw > 0 ? raw : 5 };
}

// ---------------------------------------------------------------------------
// Provider resolvers
// ---------------------------------------------------------------------------

function resolveOpenAIProvider(): ResolvedAIProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AIProviderConfigError(
      "Missing OPENAI_API_KEY. Add it to Vercel env vars or switch the active AI provider in /ai-settings.",
      "openai",
    );
  }
  return {
    id: "openai",
    client: new OpenAI({ apiKey }),
    // gpt-4.1 is the current default (smarter than gpt-4o-mini, still
    // ~4x cheaper than gpt-4o). Override with OPENAI_TEXT_MODEL=gpt-4.1-mini
    // for ~$0.40/$1.60 per 1M tokens if you want to claw back margin.
    textModel: process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-4.1",
    imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1",
    supportsImages: true,
  };
}

function resolveCustomProvider(): ResolvedAIProvider {
  const baseURL = process.env.CUSTOM_AI_BASE_URL?.trim();
  const apiKey = process.env.CUSTOM_AI_API_KEY?.trim();
  const missing: string[] = [];
  if (!baseURL) missing.push("CUSTOM_AI_BASE_URL");
  if (!apiKey) missing.push("CUSTOM_AI_API_KEY");
  if (missing.length > 0) {
    throw new AIProviderConfigError(
      `Custom AI is selected but ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} not set on Vercel. Add the env var(s) and redeploy, or switch back to OpenAI in /ai-settings.`,
      "custom",
    );
  }
  // The OpenAI SDK auto-appends `/chat/completions` etc. to the
  // baseURL, so admins should set CUSTOM_AI_BASE_URL to the root,
  // e.g. https://my-llm.example.com/v1
  const textModel = process.env.CUSTOM_AI_TEXT_MODEL?.trim() || "default";
  const rawImage = process.env.CUSTOM_AI_IMAGE_MODEL?.trim();
  return {
    id: "custom",
    client: new OpenAI({ apiKey: apiKey!, baseURL: baseURL! }),
    textModel,
    imageModel: rawImage ? rawImage : null,
    supportsImages: !!rawImage,
  };
}

function resolveKiroProvider(): ResolvedAIProvider {
  // Same shape as the custom provider — Kiro AI exposes an
  // OpenAI-compatible REST surface — but kept separate so admins can
  // have Kiro AND a self-hosted endpoint configured at once and
  // toggle between them in /ai-settings without re-editing env vars.
  const baseURL = process.env.KIRO_AI_BASE_URL?.trim();
  const apiKey = process.env.KIRO_AI_API_KEY?.trim();
  const missing: string[] = [];
  if (!baseURL) missing.push("KIRO_AI_BASE_URL");
  if (!apiKey) missing.push("KIRO_AI_API_KEY");
  if (missing.length > 0) {
    throw new AIProviderConfigError(
      `Kiro AI is selected but ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} not set on Vercel. Add the env var(s) and redeploy, or switch back to OpenAI in /ai-settings.`,
      "kiro",
    );
  }
  const textModel = process.env.KIRO_AI_TEXT_MODEL?.trim() || "default";
  const rawImage = process.env.KIRO_AI_IMAGE_MODEL?.trim();
  return {
    id: "kiro",
    client: new OpenAI({ apiKey: apiKey!, baseURL: baseURL! }),
    textModel,
    imageModel: rawImage ? rawImage : null,
    supportsImages: !!rawImage,
  };
}

function hasOpenAIEnv(): boolean {
  return !!process.env.OPENAI_API_KEY?.trim();
}

function hasCustomEnv(): boolean {
  return (
    !!process.env.CUSTOM_AI_BASE_URL?.trim() &&
    !!process.env.CUSTOM_AI_API_KEY?.trim()
  );
}

function hasKiroEnv(): boolean {
  return (
    !!process.env.KIRO_AI_BASE_URL?.trim() &&
    !!process.env.KIRO_AI_API_KEY?.trim()
  );
}

// ---------------------------------------------------------------------------
// Image-generation fallback
//
// When the active provider is Kiro or Custom and its image call fails
// (e.g. the endpoint doesn't support /images/generations), we can fall
// back to the OpenAI cloud — provided OPENAI_API_KEY is set. This
// keeps the admin's text flow on Kiro/Custom while still getting hero
// images from OpenAI's gpt-image-1.
// ---------------------------------------------------------------------------

export interface ImageFallbackClient {
  client: OpenAI;
  imageModel: string;
}

/**
 * Returns an OpenAI-cloud image client when the active provider is NOT
 * OpenAI and `OPENAI_API_KEY` is available. Returns `null` otherwise
 * (meaning no fallback is possible).
 */
export function getImageFallbackClient(
  activeProviderId: AIProviderId,
): ImageFallbackClient | null {
  if (activeProviderId === "openai") return null; // already using OpenAI
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    client: new OpenAI({ apiKey }),
    imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1",
  };
}

// ---------------------------------------------------------------------------
// Backwards-compat shims
//
// A handful of older callers still expect the old sync getters. They
// always return the OpenAI-cloud configuration regardless of the
// admin's selection — that's fine because none of them actually issue
// AI calls; they just check shapes / feature flags. Real AI dispatch
// goes through `resolveActiveAIProvider()`.
// ---------------------------------------------------------------------------

let _legacyClient: OpenAI | null = null;

/** @deprecated Prefer `resolveActiveAIProvider()`. */
export function getOpenAI(): OpenAI {
  if (_legacyClient) return _legacyClient;
  _legacyClient = resolveOpenAIProvider().client;
  return _legacyClient;
}

/** @deprecated Prefer `resolveActiveAIProvider().textModel`. */
export function getTextModel(): string {
  return process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-4.1";
}

/** @deprecated Prefer `resolveActiveAIProvider().imageModel`. */
export function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}
