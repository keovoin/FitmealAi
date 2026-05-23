import { z } from "zod";

/**
 * The strict JSON shape we ask OpenAI to produce. Validated with zod
 * before insertion so a malformed model response doesn't poison the DB.
 *
 * The schemas are kept as plain `z.object`s (no `z.preprocess`) so
 * the inferred TS types stay sharp inside `z.array(...)`. Field-alias
 * normalization for the model's occasional synonyms (`ingredient` →
 * `name`, `mealType` → `meal_type`, etc.) is handled by the
 * normalizers in `json-parse.ts`, applied as a transform PARAMETER
 * to `parseWithEnvelope` rather than baked into the schema.
 */

export const IngredientSchema = z.object({
  name: z.string().min(1).max(80),
  grams: z.number().int().min(1).max(2000),
  calories: z.number().int().min(0).max(3000),
  protein_g: z.number().int().min(0).max(300),
  carbs_g: z.number().int().min(0).max(300),
  fat_g: z.number().int().min(0).max(300),
});
export type Ingredient = z.infer<typeof IngredientSchema>;

export const GeneratedMealSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().int().min(50).max(2500),
  protein_g: z.number().int().min(0).max(250),
  carbs_g: z.number().int().min(0).max(300),
  fat_g: z.number().int().min(0).max(200),
  ingredients: z.array(IngredientSchema).min(2).max(15),
  recipe_steps: z.array(z.string().min(4).max(400)).min(2).max(10),
  image_prompt: z.string().min(8).max(280),
});
export type GeneratedMeal = z.infer<typeof GeneratedMealSchema>;

export const GeneratedPlanSchema = z.object({
  meals: z.array(GeneratedMealSchema).min(1).max(5),
});
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

/**
 * Request body shape for /api/ai/meal-plan. iOS sends user prefs and
 * the server enforces auth + rate limits + cache + DB write.
 */
export const MealPlanRequestSchema = z.object({
  user_id: z.string().uuid(),
  goal: z.enum(["lose_weight", "build_muscle", "stay_fit", "eat_healthier"]),
  daily_calorie_target: z.number().int().min(800).max(6000),
  diets: z.array(z.string().min(1).max(40)).min(1).max(8),
  allergies: z.array(z.string().min(1).max(40)).max(20).default([]),
  cook_time: z.string().min(1).max(20),
  meal_types: z
    .array(z.enum(["breakfast", "lunch", "dinner", "snack"]))
    .min(1)
    .max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  // When true, the API returns the cached plan if one already exists
  // for this user+date with no superseded_at; otherwise it always
  // generates a new versioned plan.
  reuse_today_if_present: z.boolean().default(true),
});
export type MealPlanRequest = z.infer<typeof MealPlanRequestSchema>;

/**
 * Slugify a meal title for the de-dup cache key in `meals.slug`.
 *  - lowercased
 *  - non-alphanumerics replaced with '-'
 *  - collapsed runs of '-'
 *  - trimmed
 *  - max 80 chars (matches a typical citext index sweet spot)
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
