import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getOpenAI, getTextModel, getImageModel, getDailyBudget } from "./openai";
import {
  buildImagePrompt,
  buildMealPlanSystemPrompt,
  buildMealPlanUserPrompt,
} from "./prompts";
import { imageCallCostMicro, textCallCostMicro } from "./cost";
import {
  GeneratedMeal,
  GeneratedMealSchema,
  GeneratedPlanSchema,
  MealPlanRequest,
  slugify,
} from "./types";

export interface MealPlanOutcome {
  ok: true;
  plan_id: string;
  reused: boolean;
  meals: Array<{
    meal_id: string;
    title: string;
    calories: number;
    image_url: string | null;
    cache_hit: boolean;
  }>;
  rate_limit: {
    daily_used: number;
    daily_limit: number;
  };
}

export interface MealPlanError {
  ok: false;
  status: number;
  reason: string;
  retry_after_seconds?: number;
}

export async function generateMealPlan(
  req: MealPlanRequest,
): Promise<MealPlanOutcome | MealPlanError> {
  const sb = getSupabaseAdmin();

  // ---- 1. Rate limit check ------------------------------------------------
  const { data: rl, error: rlErr } = await sb.rpc("check_ai_rate_limit", {
    p_user_id: req.user_id,
    p_kind: "meal_plan",
  });
  if (rlErr) {
    return { ok: false, status: 500, reason: `rate_limit_lookup: ${rlErr.message}` };
  }
  const rateRow = (rl as Array<{
    allowed: boolean;
    reason: string;
    retry_after_seconds: number;
    daily_used: number;
    daily_limit: number;
  }>)?.[0];
  if (!rateRow) {
    return { ok: false, status: 500, reason: "rate_limit_no_row" };
  }
  if (!rateRow.allowed) {
    return {
      ok: false,
      status: 429,
      reason: rateRow.reason,
      retry_after_seconds: rateRow.retry_after_seconds,
    };
  }

  // ---- 2. Daily global budget check --------------------------------------
  const budget = getDailyBudget();
  const { data: spendRow, error: spendErr } = await sb
    .from("ai_generations")
    .select("cost_usd_micro")
    .gte("created_at", todayStartIso())
    .eq("succeeded", true);
  if (spendErr) {
    return { ok: false, status: 500, reason: `budget_lookup: ${spendErr.message}` };
  }
  const spentMicro = (spendRow ?? []).reduce(
    (acc, r) => acc + (r.cost_usd_micro ?? 0),
    0,
  );
  if (spentMicro / 1_000_000 >= budget.ceilingUsd) {
    return {
      ok: false,
      status: 503,
      reason: "global_budget_reached",
      retry_after_seconds: secondsUntilUtcMidnight(),
    };
  }

  // ---- 3. Optional: reuse today's plan -----------------------------------
  if (req.reuse_today_if_present) {
    const reused = await findReusablePlan(req);
    if (reused) {
      return reused;
    }
  }

  // ---- 4. Generate meal text ---------------------------------------------
  const openai = getOpenAI();
  const textModel = getTextModel();

  let textCompletion;
  try {
    textCompletion = await openai.chat.completions.create({
      model: textModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildMealPlanSystemPrompt() },
        { role: "user", content: buildMealPlanUserPrompt(req) },
      ],
      temperature: 0.7,
    });
  } catch (err) {
    await logFailedGeneration(req.user_id, "meal_plan", textModel, errorCode(err));
    return {
      ok: false,
      status: 502,
      reason: "openai_text_failed",
    };
  }

  const rawText = textCompletion.choices[0]?.message?.content ?? "";
  let parsed;
  try {
    parsed = GeneratedPlanSchema.parse(JSON.parse(rawText));
  } catch (err) {
    await logFailedGeneration(req.user_id, "meal_plan", textModel, "schema_invalid");
    return {
      ok: false,
      status: 502,
      reason: "openai_returned_invalid_json",
    };
  }

  const usage = textCompletion.usage;
  const textCostMicro = textCallCostMicro(
    textModel,
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0,
  );

  // ---- 5. Create the plan row + per-meal items via upsert_meal_by_slug ----
  const planInsert = await sb
    .from("meal_plans")
    .insert({
      user_id: req.user_id,
      plan_date: req.date,
      generated_model: textModel,
      source: "ai",
    })
    .select("id")
    .single();

  if (planInsert.error || !planInsert.data) {
    return {
      ok: false,
      status: 500,
      reason: `plan_insert: ${planInsert.error?.message ?? "unknown"}`,
    };
  }
  const planId = planInsert.data.id;

  // Mark older active plans for the same date as superseded so the
  // "latest plan for this date" query stays simple.
  await sb
    .from("meal_plans")
    .update({ superseded_at: new Date().toISOString() })
    .eq("user_id", req.user_id)
    .eq("plan_date", req.date)
    .neq("id", planId)
    .is("superseded_at", null);

  // Log the text generation as one row.
  await sb.from("ai_generations").insert({
    user_id: req.user_id,
    kind: "meal_plan",
    meal_plan_id: planId,
    model: textModel,
    input_tokens: usage?.prompt_tokens ?? 0,
    output_tokens: usage?.completion_tokens ?? 0,
    cost_usd_micro: textCostMicro,
    request_id: textCompletion.id,
    cache_hit: false,
    succeeded: true,
  });

  // ---- 6. Per-meal: cache lookup -> image gen -> persist ----------------
  const result: MealPlanOutcome["meals"] = [];
  let position = 0;
  for (const meal of parsed.meals) {
    const item = await persistMeal(req.user_id, planId, position, meal);
    result.push(item);
    position += 1;
  }

  return {
    ok: true,
    plan_id: planId,
    reused: false,
    meals: result,
    rate_limit: {
      daily_used: rateRow.daily_used + 1,
      daily_limit: rateRow.daily_limit,
    },
  };
}

// ---- Helpers --------------------------------------------------------------

async function findReusablePlan(
  req: MealPlanRequest,
): Promise<MealPlanOutcome | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("meal_plans")
    .select(
      `id,
       generated_model,
       items:meal_plan_items (
         meal_id, position,
         meal:meals ( title, calories, image_url )
       )`,
    )
    .eq("user_id", req.user_id)
    .eq("plan_date", req.date)
    .is("superseded_at", null)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  type ItemRow = {
    meal_id: string;
    position: number;
    meal: { title: string; calories: number; image_url: string | null } | null;
  };
  const items = (data.items as unknown as ItemRow[]) ?? [];
  if (items.length === 0) return null;

  return {
    ok: true,
    plan_id: data.id as string,
    reused: true,
    meals: items
      .sort((a, b) => a.position - b.position)
      .map((it) => ({
        meal_id: it.meal_id,
        title: it.meal?.title ?? "",
        calories: it.meal?.calories ?? 0,
        image_url: it.meal?.image_url ?? null,
        cache_hit: true,
      })),
    rate_limit: { daily_used: 0, daily_limit: 0 },
  };
}

async function persistMeal(
  userId: string,
  planId: string,
  position: number,
  meal: GeneratedMeal,
): Promise<MealPlanOutcome["meals"][number]> {
  const sb = getSupabaseAdmin();
  const slug = slugify(meal.title);

  const { data: upsertRows, error } = await sb.rpc("upsert_meal_by_slug", {
    p_slug: slug,
    p_title: meal.title,
    p_meal_type: meal.meal_type,
    p_calories: meal.calories,
    p_protein_g: meal.protein_g,
    p_carbs_g: meal.carbs_g,
    p_fat_g: meal.fat_g,
    p_ingredients: meal.ingredients,
    p_recipe_steps: meal.recipe_steps,
    p_model: getTextModel(),
  });
  if (error || !upsertRows) {
    return {
      meal_id: "",
      title: meal.title,
      calories: meal.calories,
      image_url: null,
      cache_hit: false,
    };
  }
  const row = (upsertRows as Array<{ meal_id: string; was_inserted: boolean }>)[0];
  const mealId = row.meal_id;
  const wasInserted = row.was_inserted;

  // Ensure the join row exists.
  await sb.from("meal_plan_items").insert({
    meal_plan_id: planId,
    meal_id: mealId,
    position,
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
  });

  // If the meal already existed, log a cache hit and return its image.
  if (!wasInserted) {
    await sb.from("ai_generations").insert({
      user_id: userId,
      kind: "meal_image",
      meal_id: mealId,
      model: getImageModel(),
      cost_usd_micro: 0,
      cache_hit: true,
      succeeded: true,
    });
    const { data: existing } = await sb
      .from("meals")
      .select("image_url")
      .eq("id", mealId)
      .single();
    return {
      meal_id: mealId,
      title: meal.title,
      calories: meal.calories,
      image_url: existing?.image_url ?? null,
      cache_hit: true,
    };
  }

  // New meal: generate an image, upload, store the URL.
  const imageUrl = await generateAndStoreImage(userId, mealId, meal);

  return {
    meal_id: mealId,
    title: meal.title,
    calories: meal.calories,
    image_url: imageUrl,
    cache_hit: false,
  };
}

async function generateAndStoreImage(
  userId: string,
  mealId: string,
  meal: GeneratedMeal,
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  const openai = getOpenAI();
  const imageModel = getImageModel();
  const prompt = buildImagePrompt(meal.image_prompt, meal.title);

  let imageResp;
  try {
    imageResp = await openai.images.generate({
      model: imageModel,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });
  } catch (err) {
    await logFailedGeneration(userId, "meal_image", imageModel, errorCode(err), mealId);
    return null;
  }
  const b64 = imageResp.data?.[0]?.b64_json;
  if (!b64) {
    await logFailedGeneration(userId, "meal_image", imageModel, "no_b64", mealId);
    return null;
  }

  const buffer = Buffer.from(b64, "base64");
  const objectPath = `${mealId}.png`;
  const { error: uploadErr } = await sb.storage
    .from("meal-images")
    .upload(objectPath, buffer, {
      contentType: "image/png",
      upsert: true,
    });
  if (uploadErr) {
    await logFailedGeneration(userId, "meal_image", imageModel, "storage_upload_failed", mealId);
    return null;
  }

  const { data: publicUrl } = sb.storage.from("meal-images").getPublicUrl(objectPath);
  const url = publicUrl?.publicUrl ?? null;

  await sb
    .from("meals")
    .update({ image_storage_path: objectPath, image_url: url })
    .eq("id", mealId);

  await sb.from("ai_generations").insert({
    user_id: userId,
    kind: "meal_image",
    meal_id: mealId,
    model: imageModel,
    cost_usd_micro: imageCallCostMicro(imageModel),
    cache_hit: false,
    succeeded: true,
  });

  return url;
}

async function logFailedGeneration(
  userId: string,
  kind: "meal_plan" | "meal_image" | "workout_plan",
  model: string,
  code: string,
  mealId?: string,
) {
  const sb = getSupabaseAdmin();
  await sb.from("ai_generations").insert({
    user_id: userId,
    kind,
    model,
    cost_usd_micro: 0,
    cache_hit: false,
    succeeded: false,
    error_code: code,
    meal_id: mealId,
  });
}

function errorCode(err: unknown): string {
  if (err instanceof Error) return err.name === "Error" ? err.message.slice(0, 60) : err.name;
  return "unknown";
}

function todayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + 1);
  next.setUTCHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - now.getTime()) / 1000);
}
