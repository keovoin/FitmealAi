import { z } from "zod";
import type {
  RecipeIngredient,
  RecipeWriteInput,
} from "@/lib/supabase/recipes-shared";

/**
 * Strict zod schema for a single row in a bulk-uploaded JSON file.
 *
 * On purpose, this is more permissive than `RecipeWriteInput` in
 * a couple of ways so existing exports / hand-rolled JSON don't
 * fight us:
 *
 *   - both camelCase and snake_case keys for nutrition and meal type
 *   - macros default to 0 when omitted
 *   - ingredients/steps default to empty arrays
 *
 * The parser normalizes everything into the camelCase shape used
 * by `upsertRecipe()`.
 *
 * Pure / isomorphic: no DB calls, no `server-only`, so the validate
 * step can run client-side too if we ever want a "preview before
 * upload" UX.
 */

const ingredientWireSchema = z
  .object({
    name: z.string().min(1).max(80),
    grams: z.number().int().min(0).max(2000).default(0),
    calories: z.number().int().min(0).max(3000).default(0),
    proteinGrams: z.number().int().min(0).max(300).optional(),
    protein_g: z.number().int().min(0).max(300).optional(),
    carbsGrams: z.number().int().min(0).max(300).optional(),
    carbs_g: z.number().int().min(0).max(300).optional(),
    fatGrams: z.number().int().min(0).max(300).optional(),
    fat_g: z.number().int().min(0).max(300).optional(),
  })
  .transform((row): RecipeIngredient => ({
    name: row.name,
    grams: row.grams,
    calories: row.calories,
    proteinGrams: row.proteinGrams ?? row.protein_g ?? 0,
    carbsGrams: row.carbsGrams ?? row.carbs_g ?? 0,
    fatGrams: row.fatGrams ?? row.fat_g ?? 0,
  }));

const recipeWireSchema = z
  .object({
    title: z.string().min(2).max(200),
    description: z.string().max(500).nullish(),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
    meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
    diets: z.array(z.string().min(1).max(40)).max(8).optional(),
    allergens: z.array(z.string().min(1).max(40)).max(20).optional(),
    tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    cookTimeMinutes: z.number().int().min(0).max(720).nullish(),
    cook_time_minutes: z.number().int().min(0).max(720).nullish(),
    calories: z.number().int().min(0).max(2500),
    proteinGrams: z.number().int().min(0).max(250).optional(),
    protein_g: z.number().int().min(0).max(250).optional(),
    carbsGrams: z.number().int().min(0).max(300).optional(),
    carbs_g: z.number().int().min(0).max(300).optional(),
    fatGrams: z.number().int().min(0).max(200).optional(),
    fat_g: z.number().int().min(0).max(200).optional(),
    ingredients: z.array(ingredientWireSchema).max(30).optional(),
    recipeSteps: z.array(z.string().min(1).max(400)).max(20).optional(),
    recipe_steps: z.array(z.string().min(1).max(400)).max(20).optional(),
    imageUrl: z.string().url().nullish(),
    image_url: z.string().url().nullish(),
    thumbnailUrl: z.string().url().nullish(),
    thumbnail_url: z.string().url().nullish(),
  })
  .superRefine((row, ctx) => {
    if (!row.mealType && !row.meal_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing "mealType" (one of breakfast, lunch, dinner, snack).',
        path: ["mealType"],
      });
    }
  });

export interface BulkRow {
  /** Stable index from the source file, useful for error rendering. */
  index: number;
  /** Either the parsed input or the validation error message. */
  result:
    | { ok: true; recipe: RecipeWriteInput }
    | { ok: false; error: string };
}

export interface BulkParseReport {
  /** Total rows seen in the source file. */
  total: number;
  /** Rows that parsed cleanly. */
  validRows: { index: number; recipe: RecipeWriteInput }[];
  /** Rows that failed validation, with a printable message. */
  invalidRows: { index: number; error: string; raw: unknown }[];
  /** Top-level parse errors, e.g. file isn't valid JSON or isn't an array. */
  fileErrors: string[];
}

/**
 * Parse and validate a bulk-upload payload. Accepts:
 *   - a JSON string containing an array of recipe rows
 *   - or `{ recipes: [...] }`
 *
 * Each row is validated independently; a single bad row never sinks
 * the whole upload.
 */
export function parseBulkRecipesJson(text: string): BulkParseReport {
  const fileErrors: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return {
      total: 0,
      validRows: [],
      invalidRows: [],
      fileErrors: [
        `Not valid JSON: ${(e as Error).message.slice(0, 200)}.`,
      ],
    };
  }

  // Accept either a bare array or { recipes: [...] }.
  let rows: unknown[];
  if (Array.isArray(raw)) {
    rows = raw;
  } else if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as { recipes?: unknown }).recipes)
  ) {
    rows = (raw as { recipes: unknown[] }).recipes;
  } else {
    return {
      total: 0,
      validRows: [],
      invalidRows: [],
      fileErrors: [
        'Expected an array of recipes, or an object like { "recipes": [...] }.',
      ],
    };
  }

  if (rows.length === 0) {
    fileErrors.push("File contains zero recipes.");
  }
  if (rows.length > 200) {
    fileErrors.push(
      `Refusing to import ${rows.length} recipes in one go (cap is 200). Split the file.`,
    );
    return {
      total: rows.length,
      validRows: [],
      invalidRows: [],
      fileErrors,
    };
  }

  const validRows: BulkParseReport["validRows"] = [];
  const invalidRows: BulkParseReport["invalidRows"] = [];

  rows.forEach((row, index) => {
    const parsed = recipeWireSchema.safeParse(row);
    if (!parsed.success) {
      invalidRows.push({
        index,
        error: formatZodError(parsed.error),
        raw: row,
      });
      return;
    }
    validRows.push({
      index,
      recipe: normalizeRecipe(parsed.data),
    });
  });

  return {
    total: rows.length,
    validRows,
    invalidRows,
    fileErrors,
  };
}

function normalizeRecipe(
  row: z.infer<typeof recipeWireSchema>,
): RecipeWriteInput {
  // mealType is guaranteed by superRefine, so non-null assertion is safe.
  const mealType = (row.mealType ?? row.meal_type)!;
  return {
    title: row.title.trim().slice(0, 200),
    description: row.description?.trim() || null,
    mealType,
    diets: row.diets ?? [],
    allergens: row.allergens ?? [],
    tags: row.tags ?? [],
    cookTimeMinutes: row.cookTimeMinutes ?? row.cook_time_minutes ?? null,
    calories: row.calories,
    proteinGrams: row.proteinGrams ?? row.protein_g ?? 0,
    carbsGrams: row.carbsGrams ?? row.carbs_g ?? 0,
    fatGrams: row.fatGrams ?? row.fat_g ?? 0,
    ingredients: row.ingredients ?? [],
    recipeSteps: row.recipeSteps ?? row.recipe_steps ?? [],
    imageUrl: row.imageUrl ?? row.image_url ?? null,
    thumbnailUrl: row.thumbnailUrl ?? row.thumbnail_url ?? null,
    source: "imported",
    status: "draft",
  };
}

function formatZodError(err: z.ZodError): string {
  // Compact, single-line error string the UI can render in a table cell.
  const issues = err.errors
    .slice(0, 4)
    .map((i) => {
      const path = i.path.length > 0 ? i.path.join(".") : "(root)";
      return `${path}: ${i.message}`;
    })
    .join("; ");
  return err.errors.length > 4 ? `${issues}; … and more` : issues;
}

/** Sample JSON shown in the bulk-upload empty state. Kept tiny. */
export const BULK_RECIPES_SAMPLE = `[
  {
    "title": "Greek yogurt bowl",
    "mealType": "breakfast",
    "calories": 360,
    "proteinGrams": 24,
    "carbsGrams": 48,
    "fatGrams": 8,
    "cookTimeMinutes": 5,
    "diets": ["balanced", "vegetarian"],
    "allergens": ["dairy"],
    "ingredients": [
      { "name": "Greek yogurt", "grams": 200, "calories": 130, "proteinGrams": 18, "carbsGrams": 9, "fatGrams": 5 },
      { "name": "Granola", "grams": 40, "calories": 180, "proteinGrams": 4, "carbsGrams": 28, "fatGrams": 5 },
      { "name": "Mixed berries", "grams": 80, "calories": 50, "proteinGrams": 1, "carbsGrams": 12, "fatGrams": 0 }
    ],
    "recipeSteps": [
      "Spoon yogurt into a bowl.",
      "Top with granola and berries."
    ]
  }
]
`;
