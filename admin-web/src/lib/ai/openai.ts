import "server-only";
import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to Vercel env vars to enable /api/ai/meal-plan.",
    );
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

export function getTextModel(): string {
  return process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";
}

export function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
}

export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export interface DailyBudget {
  /** Hard ceiling in USD per day across all users. */
  ceilingUsd: number;
}

export function getDailyBudget(): DailyBudget {
  const raw = Number(process.env.OPENAI_DAILY_BUDGET_USD);
  return { ceilingUsd: Number.isFinite(raw) && raw > 0 ? raw : 5 };
}
