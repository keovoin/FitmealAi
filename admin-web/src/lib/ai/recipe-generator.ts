import "server-only";
import type OpenAI from "openai";
import { z } from "zod";
import {
  AIProviderConfigError,
  getDailyBudget,
  getImageFallbackClient,
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
  grams: z.coerce.number().int().min(0).max(2000),
  calories: z.coerce.number().int().min(0).max(3000),
  protein_g: z.coerce.number().int().min(0).max(300),
  carbs_g: z.coerce.number().int().min(0).max(300),
  fat_g: z.coerce.number().int().min(0).max(300),
}).passthrough();

const GeneratedRecipeSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(280).optional(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  cook_time_minutes: z.coerce.number().int().min(1).max(240).optional(),
  diets: z.array(z.string().min(1).max(40)).max(8),
  allergens: z.array(z.string().min(1).max(40)).max(20),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  calories: z.coerce.number().int().min(50).max(2500),
  protein_g: z.coerce.number().int().min(0).max(250),
  carbs_g: z.coerce.number().int().min(0).max(300),
  fat_g: z.coerce.number().int().min(0).max(200),
  ingredients: z.array(IngredientSchema).min(2).max(15),
  recipe_steps: z.array(z.string().min(4).max(400)).min(2).max(12),
  image_prompt: z.string().min(8).max(280),
}).passthrough();

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

/**
 * Normalize field aliases the model might use instead of our expected names.
 * Applied recursively to handle nested envelopes.
 */
function normalizeRecipeFields(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(normalizeRecipeFields);

  const r = obj as Record<string, unknown>;
  const result: Record<string, unknown> = { ...r };

  // Recipe-level aliases
  if (!result.title && result.name) result.title = result.name;
  if (!result.meal_type && result.mealType) result.meal_type = result.mealType;
  if (!result.cook_time_minutes && result.cookTime) {
    const n = parseInt(String(result.cookTime), 10);
    if (n > 0) result.cook_time_minutes = n;
  }
  if (!result.cook_time_minutes && result.cook_time) {
    const n = parseInt(String(result.cook_time), 10);
    if (n > 0) result.cook_time_minutes = n;
  }
  if (!result.recipe_steps && result.steps) result.recipe_steps = result.steps;
  if (!result.recipe_steps && result.recipeSteps) result.recipe_steps = result.recipeSteps;
  if (!result.recipe_steps && result.instructions) result.recipe_steps = result.instructions;
  if (!result.image_prompt && result.imagePrompt) result.image_prompt = result.imagePrompt;
  if (!result.protein_g && result.protein) result.protein_g = result.protein;
  if (!result.carbs_g && result.carbs) result.carbs_g = result.carbs;
  if (!result.fat_g && result.fat) result.fat_g = result.fat;

  // Normalize ingredients if present
  if (Array.isArray(result.ingredients)) {
    result.ingredients = (result.ingredients as Record<string, unknown>[]).map((ing) => {
      const i = { ...ing };
      if (!i.name && i.ingredient) i.name = i.ingredient;
      if (!i.grams && i.weight_g) i.grams = i.weight_g;
      if (!i.grams && i.amount_g) i.grams = i.amount_g;
      if (!i.grams && i.weight) i.grams = i.weight;
      if (!i.protein_g && i.protein) i.protein_g = i.protein;
      if (!i.carbs_g && i.carbs) i.carbs_g = i.carbs;
      if (!i.fat_g && i.fat) i.fat_g = i.fat;
      // Coerce string numbers like "150g" → 150
      for (const key of ["grams", "calories", "protein_g", "carbs_g", "fat_g"]) {
        if (typeof i[key] === "string") {
          i[key] = parseInt(String(i[key]).replace(/[^0-9.-]/g, ""), 10) || 0;
        }
      }
      return i;
    });
  }

  // Normalize nested envelope values too
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val && typeof val === "object" && !Array.isArray(val) && key !== "ingredients") {
      // Don't recurse into arrays or already-processed ingredients
      result[key] = normalizeRecipeFields(val);
    }
  }

  return result;
}

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
    const looseParsed = parseLooseJson(raw);
    const normalized = normalizeRecipeFields(looseParsed);
    parsed = parseWithEnvelope(GeneratedRecipeSchema, normalized);
  } catch (err) {
    await logFailure(
      opts.adminUserId,
      "meal_plan",
      textModel,
      "schema_invalid",
    );
    const detail =
      err instanceof Error ? err.message.slice(0, 120) : "unknown";
    // Include a snippet of the raw response so the admin can see what
    // the model actually returned (helps debug Kiro/Custom responses).
    const rawSnippet = raw.slice(0, 300);
    console.error("[recipe-generator] schema_invalid. Raw AI response:", rawSnippet);
    return {
      ok: false,
      status: 502,
      error: `AI returned invalid JSON (${detail}). Raw preview: ${rawSnippet.slice(0, 150)}...`,
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
  //    the recipe — we just surface a warning. When the active provider
  //    doesn't support images, fall back to OpenAI cloud if available.
  let imageUrl: string | null = null;
  if (opts.withImage) {
    if (!provider.supportsImages) {
      // Active provider has no image model — try OpenAI fallback.
      const fallback = getImageFallbackClient(provider.id);
      if (fallback) {
        try {
          imageUrl = await generateAndUploadImageWithFallback(
            parsed, fallback.client, fallback.imageModel, opts.adminUserId,
          );
        } catch (err) {
          const detail =
            err instanceof Error ? err.message.slice(0, 200) : "unknown";
          warnings.push(
            `Hero image generation failed via OpenAI fallback (${detail}). The recipe was generated; you can upload an image manually.`,
          );
        }
      } else {
        warnings.push(
          `Image generation skipped — active AI provider (${provider.id}) has no image model configured and OPENAI_API_KEY is not set for fallback. Upload a hero image manually.`,
        );
      }
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
  const prompt = buildImagePrompt(recipe.image_prompt, recipe.title);

  // Try the active provider first. If it fails (e.g. Kiro/Custom doesn't
  // support /images/generations), fall back to the OpenAI cloud when
  // OPENAI_API_KEY is available.
  let b64: string | undefined;
  let usedModel = provider.imageModel;

  try {
    const resp = await provider.client.images.generate({
      model: provider.imageModel,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });
    b64 = resp.data?.[0]?.b64_json ?? undefined;
  } catch (primaryErr) {
    // Attempt OpenAI fallback when the active provider isn't already OpenAI.
    const fallback = getImageFallbackClient(provider.id);
    if (fallback) {
      const resp = await fallback.client.images.generate({
        model: fallback.imageModel,
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });
      b64 = resp.data?.[0]?.b64_json ?? undefined;
      usedModel = fallback.imageModel;
    } else {
      // No fallback available — re-throw the original error so the
      // caller surfaces the warning to the admin.
      throw primaryErr;
    }
  }

  if (!b64) {
    await logFailure(adminUserId, "meal_image", usedModel, "no_b64");
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
    model: usedModel,
    costUsdMicro: imageCallCostMicro(usedModel),
  });

  return uploaded.url;
}

/**
 * Generate + upload an image using a specific client + model directly
 * (no primary attempt). Used when the active provider has no image
 * support at all and we go straight to the OpenAI fallback.
 */
async function generateAndUploadImageWithFallback(
  recipe: GeneratedRecipe,
  client: OpenAI,
  imageModel: string,
  adminUserId?: string,
): Promise<string | null> {
  const prompt = buildImagePrompt(recipe.image_prompt, recipe.title);

  const resp = await client.images.generate({
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
