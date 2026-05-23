import "server-only";
import { z } from "zod";
import {
  AIProviderConfigError,
  getDailyBudget,
  resolveActiveAIProvider,
  type ResolvedAIProvider,
} from "./openai";
import { parseLooseJson, parseWithEnvelope } from "./json-parse";
import { buildImagePrompt } from "./prompts";
import { imageCallCostMicro, textCallCostMicro } from "./cost";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { uploadRecipeImage } from "@/lib/supabase/storage";
import {
  slugifyTitle,
  type MealType,
  type RecipeIngredient,
  type RecipeWriteInput,
} from "@/lib/supabase/recipes-shared";

/**
 * Admin-side helper: ask OpenAI for ONE recipe matching the given
 * hints, validate the JSON, and (optionally) generate a hero image
 * uploaded to the `recipe-images` bucket. The returned shape is a
 * ready-to-save `RecipeWriteInput` so the admin form can pre-fill it
 * and the human can review/edit before publishing.
 *
 * Mirrors the contract in `recipes-shared.ts`:
 *   - source = "ai_generated"
 *   - status = "draft" (admin chooses when to publish)
 *
 * Cost tracking caveat: `ai_generations.user_id` is NOT NULL and
 * references `profiles(id)`. The admin web is single-password cookie
 * auth (no Supabase user), so admin-triggered generations bypass the
 * `ai_generations` log when no `adminUserId` is available. They DO
 * still respect the shared `OPENAI_DAILY_BUDGET_USD` ceiling — but
 * their cost doesn't decrement that budget. Acceptable because admin
 * generations are click-bounded; if this ever becomes a concern, the
 * fix is migrating ai_generations.user_id to nullable + adding a
 * dedicated admin-tracker row.
 */

// -----------------------------------------------------------------------------
// Wire schema fed into OpenAI's response_format=json_object
// -----------------------------------------------------------------------------

const IngredientSchema = z.object({
  name: z.string().min(1).max(80),
  grams: z.number().int().min(1).max(2000),
  calories: z.number().int().min(0).max(3000),
  protein_g: z.number().int().min(0).max(300),
  carbs_g: z.number().int().min(0).max(300),
  fat_g: z.number().int().min(0).max(300),
});

const GeneratedRecipeSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(280).optional(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  cook_time_minutes: z.number().int().min(1).max(240).optional(),
  diets: z.array(z.string().min(1).max(40)).max(8),
  allergens: z.array(z.string().min(1).max(40)).max(20),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  calories: z.number().int().min(50).max(2500),
  protein_g: z.number().int().min(0).max(250),
  carbs_g: z.number().int().min(0).max(300),
  fat_g: z.number().int().min(0).max(200),
  ingredients: z.array(IngredientSchema).min(2).max(15),
  recipe_steps: z.array(z.string().min(4).max(400)).min(2).max(12),
  image_prompt: z.string().min(8).max(280),
});

type GeneratedRecipe = z.infer<typeof GeneratedRecipeSchema>;

// -----------------------------------------------------------------------------
// Public input/output
// -----------------------------------------------------------------------------

export interface GenerateRecipeOptions {
  mealType: MealType;
  /** Free-form hint, e.g. "high-protein post-workout bowl". Optional. */
  titleHint?: string;
  /** Per-serving target. Defaults to a reasonable lunch. */
  calorieTarget: number;
  diets: string[];
  /** Allergens to STRICTLY avoid (e.g. ["dairy", "nuts"]). */
  allergens: string[];
  /** Maximum cook time in minutes. Optional ceiling. */
  cookTimeMinutes?: number;
  /** Generate + upload a hero image (~2-5 sec extra latency, ~$0.04). */
  withImage: boolean;
  /** UUID of the admin user, persisted as `recipes.created_by`. */
  adminUserId?: string;
}

export interface GenerateRecipeResult {
  /** Pre-filled form payload — NOT yet persisted. */
  recipe: RecipeWriteInput;
  /** Hero image URL, if `withImage` succeeded. */
  imageUrl: string | null;
  /** Whether OpenAI returned us a valid recipe (vs. fallback skip). */
  warnings: string[];
}

export type GenerateRecipeOutcome =
  | { ok: true; result: GenerateRecipeResult }
  | { ok: false; status: number; error: string };

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

export async function generateRecipeForAdmin(
  opts: GenerateRecipeOptions,
): Promise<GenerateRecipeOutcome> {
  // 1. Honor the daily budget ceiling shared with /api/ai/meal-plan.
  const overBudget = await isOverDailyBudget();
  if (overBudget) {
    return {
      ok: false,
      status: 503,
      error:
        "Daily OpenAI budget reached. Wait until UTC midnight or raise OPENAI_DAILY_BUDGET_USD.",
    };
  }

  // 2. Resolve the admin-selected provider (OpenAI cloud vs custom
  //    OpenAI-compatible endpoint). Re-resolved per request so flipping
  //    /ai-settings takes effect immediately. Throws if the active
  //    provider's env vars aren't set; surface that as a clean 503.
  let provider: ResolvedAIProvider;
  try {
    provider = await resolveActiveAIProvider();
  } catch (err) {
    if (err instanceof AIProviderConfigError) {
      return { ok: false, status: 503, error: err.message };
    }
    return {
      ok: false,
      status: 500,
      error: "AI provider could not be resolved.",
    };
  }
  const openai = provider.client;
  const textModel = provider.textModel;
  const warnings: string[] = [];

  let textCompletion;
  try {
    textCompletion = await openai.chat.completions.create({
      model: textModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(opts) },
      ],
      temperature: 0.7,
    });
  } catch (err) {
    await logFailure(opts.adminUserId, "meal_plan", textModel, errorCode(err));
    const providerLabel =
      provider.id === "custom"
        ? "Custom AI endpoint"
        : provider.id === "kiro"
          ? "Kiro AI"
          : "OpenAI";
    return {
      ok: false,
      status: 502,
      error: `${providerLabel} text request failed (${errorCode(err)}). Check the endpoint and API key in Vercel env vars.`,
    };
  }

  const raw = textCompletion.choices[0]?.message?.content ?? "";
  let parsed: GeneratedRecipe;
  try {
    // The model occasionally returns `{"recipe": {...}}` instead of
    // the flat object the prompt asks for, which used to surface as
    // a confusing "title: undefined" zod error. parseWithEnvelope
    // peels common wrapper keys before validating.
    parsed = parseWithEnvelope(GeneratedRecipeSchema, parseLooseJson(raw));
  } catch (err) {
    await logFailure(
      opts.adminUserId,
      "meal_plan",
      textModel,
      "schema_invalid",
    );
    const detail =
      err instanceof Error ? err.message.slice(0, 120) : "unknown";
    return {
      ok: false,
      status: 502,
      error: `OpenAI returned a recipe that didn't match the expected JSON shape (${detail}).`,
    };
  }

  // 3. Log the text call cost.
  const usage = textCompletion.usage;
  const textCostMicro = textCallCostMicro(
    textModel,
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0,
  );
  await logSuccess({
    userId: opts.adminUserId,
    kind: "meal_plan",
    model: textModel,
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    costUsdMicro: textCostMicro,
    requestId: textCompletion.id,
  });

  // 4. Optional hero image. Best-effort: a failed image doesn't kill
  //    the recipe — we just surface a warning. Skip silently when the
  //    active provider is custom and CUSTOM_AI_IMAGE_MODEL was left
  //    blank (most self-hosted endpoints don't expose images.generate).
  let imageUrl: string | null = null;
  if (opts.withImage) {
    if (!provider.supportsImages) {
      warnings.push(
        `Image generation skipped — active AI provider (${provider.id}) has no image model configured. Upload a hero image manually.`,
      );
    } else {
      try {
        imageUrl = await generateAndUploadImage(parsed, provider, opts.adminUserId);
      } catch (err) {
        const detail =
          err instanceof Error ? err.message.slice(0, 200) : "unknown";
        warnings.push(
          `Hero image generation failed (${detail}). The recipe was generated; you can upload an image manually.`,
        );
      }
    }
  }

  return {
    ok: true,
    result: {
      recipe: toRecipeWriteInput(parsed, imageUrl, opts.adminUserId),
      imageUrl,
      warnings,
    },
  };
}

// -----------------------------------------------------------------------------
// Prompts
// -----------------------------------------------------------------------------

const SYSTEM_PROMPT = [
  "You are a registered dietitian's assistant authoring single recipes",
  "for the FitMeal AI catalog. Each recipe must be:",
  "  - realistic, easy to cook at home",
  "  - calorie-accurate within +/- 10% of the requested target",
  "  - macro-consistent (4 kcal/g protein and carbs, 9 kcal/g fat)",
  "  - free of every listed allergen, no exceptions",
  "  - tagged with the relevant diet keywords from the user's list",
  "Recipe steps are short (1-2 sentences). Ingredients list grams,",
  "calories, and per-ingredient macros so the per-serving totals on the",
  "recipe equal the sum of the ingredients.",
  "Return EXACTLY one JSON object that matches the schema. No markdown.",
  "Include an `image_prompt` of 1-2 sentences describing the finished",
  "dish on a plate, ready for a photographer.",
].join("\n");

function buildUserPrompt(opts: GenerateRecipeOptions): string {
  const lines: string[] = [
    `Meal type: ${opts.mealType}.`,
    `Per-serving calorie target: ${opts.calorieTarget} kcal.`,
    `Diet styles to follow: ${opts.diets.length ? opts.diets.join(", ") : "balanced"}.`,
    `Allergens to STRICTLY avoid: ${opts.allergens.length ? opts.allergens.join(", ") : "none"}.`,
  ];
  if (opts.cookTimeMinutes) {
    lines.push(`Maximum cook time: ${opts.cookTimeMinutes} minutes.`);
  }
  if (opts.titleHint?.trim()) {
    lines.push(`Title hint (loose, you can rename): "${opts.titleHint.trim()}".`);
  }
  return lines.join("\n");
}

// -----------------------------------------------------------------------------
// Image generation
// -----------------------------------------------------------------------------

async function generateAndUploadImage(
  recipe: GeneratedRecipe,
  provider: ResolvedAIProvider,
  adminUserId?: string,
): Promise<string | null> {
  // Caller already checked provider.supportsImages, but assert for safety.
  if (!provider.imageModel) return null;
  const openai = provider.client;
  const imageModel = provider.imageModel;
  const prompt = buildImagePrompt(recipe.image_prompt, recipe.title);

  const resp = await openai.images.generate({
    model: imageModel,
    prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  });
  const b64 = resp.data?.[0]?.b64_json;
  if (!b64) {
    await logFailure(adminUserId, "meal_image", imageModel, "no_b64");
    return null;
  }

  const buffer = Buffer.from(b64, "base64");
  const uploaded = await uploadRecipeImage({
    buffer,
    contentType: "image/png",
    slug: slugifyTitle(recipe.title),
  });

  await logSuccess({
    userId: adminUserId,
    kind: "meal_image",
    model: imageModel,
    costUsdMicro: imageCallCostMicro(imageModel),
  });

  return uploaded.url;
}

// -----------------------------------------------------------------------------
// Mappers / utilities
// -----------------------------------------------------------------------------

function toRecipeWriteInput(
  r: GeneratedRecipe,
  imageUrl: string | null,
  adminUserId?: string,
): RecipeWriteInput {
  const ingredients: RecipeIngredient[] = r.ingredients.map((i) => ({
    name: i.name,
    grams: i.grams,
    calories: i.calories,
    proteinGrams: i.protein_g,
    carbsGrams: i.carbs_g,
    fatGrams: i.fat_g,
  }));

  return {
    title: r.title,
    description: r.description ?? null,
    mealType: r.meal_type,
    diets: r.diets,
    allergens: r.allergens,
    tags: r.tags ?? [],
    cookTimeMinutes: r.cook_time_minutes ?? null,
    calories: r.calories,
    proteinGrams: r.protein_g,
    carbsGrams: r.carbs_g,
    fatGrams: r.fat_g,
    ingredients,
    recipeSteps: r.recipe_steps,
    imageUrl,
    thumbnailUrl: imageUrl,
    source: "ai_generated",
    status: "draft",
    createdBy: adminUserId ?? null,
  };
}

async function isOverDailyBudget(): Promise<boolean> {
  const sb = getSupabaseAdmin();
  const ceilingUsd = getDailyBudget().ceilingUsd;
  const start = todayStartIso();
  const { data } = await sb
    .from("ai_generations")
    .select("cost_usd_micro")
    .gte("created_at", start)
    .eq("succeeded", true);
  const spent =
    (data ?? []).reduce(
      (acc, r) => acc + ((r as { cost_usd_micro?: number }).cost_usd_micro ?? 0),
      0,
    ) / 1_000_000;
  return spent >= ceilingUsd;
}

function todayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function logSuccess(opts: {
  userId?: string;
  kind: "meal_plan" | "meal_image";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsdMicro: number;
  requestId?: string;
}): Promise<void> {
  if (!opts.userId) return; // ai_generations.user_id is NOT NULL
  const sb = getSupabaseAdmin();
  await sb.from("ai_generations").insert({
    user_id: opts.userId,
    kind: opts.kind,
    model: opts.model,
    input_tokens: opts.inputTokens ?? 0,
    output_tokens: opts.outputTokens ?? 0,
    cost_usd_micro: opts.costUsdMicro,
    request_id: opts.requestId ?? null,
    cache_hit: false,
    succeeded: true,
  });
}

async function logFailure(
  userId: string | undefined,
  kind: "meal_plan" | "meal_image",
  model: string,
  code: string,
): Promise<void> {
  if (!userId) return;
  const sb = getSupabaseAdmin();
  await sb.from("ai_generations").insert({
    user_id: userId,
    kind,
    model,
    cost_usd_micro: 0,
    cache_hit: false,
    succeeded: false,
    error_code: code,
  });
}

function errorCode(err: unknown): string {
  if (err instanceof Error) {
    return err.name === "Error" ? err.message.slice(0, 60) : err.name;
  }
  return "unknown";
}
