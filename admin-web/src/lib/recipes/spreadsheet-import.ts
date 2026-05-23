import * as XLSX from "xlsx";

/**
 * Spreadsheet (Excel / CSV) → recipe-row JSON converter.
 *
 * Why this exists: admins prefer authoring recipes in Excel — typing
 * pure JSON is error-prone and the validators in `bulk-import.ts`
 * already accept the canonical recipe-row shape. So instead of a
 * second validation path, we parse the spreadsheet on the client into
 * the SAME row shape `parseBulkRecipesJson` already understands and
 * hand it to the existing pipeline.
 *
 * Format expected per row:
 *   - One row = one recipe.
 *   - Required columns: title, calories, mealType (or meal_type).
 *   - Macro columns: proteinGrams / protein_g, carbsGrams / carbs_g,
 *     fatGrams / fat_g — both casings work.
 *   - Optional columns: description, cookTimeMinutes / cook_time_minutes,
 *     diets, allergens, tags, imageUrl / image_url.
 *   - List columns (diets / allergens / tags / recipeSteps / ingredients):
 *       a) JSON-encoded value: `["balanced","vegetarian"]`
 *       b) Pipe-separated: `balanced|vegetarian`
 *       c) Comma-separated for short lists: `balanced, vegetarian`
 *   - For `ingredients`, JSON is strongly preferred so the macros per
 *     ingredient survive — but we also accept a shorthand
 *     `name:grams:calories:p:c:f|name:...` if the cell is huge.
 *
 * Returns the JSON string the existing `bulkUploadRecipesAction`
 * already expects (an array of plain row objects), so the rest of
 * the pipeline stays unchanged.
 */
export async function spreadsheetFileToRecipesJson(
  file: File,
): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Workbook contains no sheets.");
  }
  const sheet = wb.Sheets[firstSheetName];

  // sheet_to_json with defval:"" gives us a stable shape (empty
  // cells become "" instead of being absent) which simplifies
  // downstream column normalization.
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });

  const rows = rawRows.map((r) => normalizeRow(r));
  return JSON.stringify(rows);
}

/**
 * Per-cell normalization. Handles empty strings → undefined, list
 * cells → arrays, and ingredient shorthand → array of objects.
 */
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [rawKey, rawVal] of Object.entries(row)) {
    const key = rawKey.trim();
    if (!key) continue;
    const v = cleanValue(rawVal);
    if (v === undefined) continue;
    out[key] = v;
  }

  // List-typed columns: parse JSON or fall back to pipe / comma split.
  for (const k of ["diets", "allergens", "tags", "recipeSteps", "recipe_steps"]) {
    if (typeof out[k] === "string") {
      out[k] = parseList(out[k] as string);
    }
  }

  // Ingredients: prefer JSON, fall back to shorthand.
  if (typeof out.ingredients === "string") {
    out.ingredients = parseIngredients(out.ingredients);
  }

  // Coerce numeric-looking strings on known number fields. SheetJS
  // already returns numbers when the cell is a number, but CSV imports
  // round-trip through string.
  for (const k of [
    "calories",
    "proteinGrams",
    "protein_g",
    "carbsGrams",
    "carbs_g",
    "fatGrams",
    "fat_g",
    "cookTimeMinutes",
    "cook_time_minutes",
  ]) {
    if (typeof out[k] === "string" && out[k] !== "") {
      const n = Number(out[k]);
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}

function cleanValue(v: unknown): unknown {
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return v;
}

/**
 * Parse a list cell. JSON wins; pipe is the conventional separator;
 * comma is the fallback for short lists.
 */
function parseList(s: string): unknown {
  const trimmed = s.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  if (trimmed.includes("|")) {
    return trimmed.split("|").map((p) => p.trim()).filter(Boolean);
  }
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  }
  return [trimmed];
}

/**
 * Parse the ingredients cell. JSON arrays pass through unchanged.
 * Shorthand format:
 *   `name:grams:calories:protein_g:carbs_g:fat_g|name:...`
 * e.g. `Greek yogurt:200:130:18:9:5|Granola:40:180:4:28:5`
 */
function parseIngredients(s: string): unknown {
  const trimmed = s.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to shorthand parsing
    }
  }

  if (!trimmed.includes("|") && !trimmed.includes(":")) {
    // Single-token cell; downstream zod will report the missing fields.
    return [{ name: trimmed }];
  }

  return trimmed.split("|").map((part) => {
    const segments = part.split(":").map((p) => p.trim());
    const [name, grams, calories, protein_g, carbs_g, fat_g] = segments;
    const num = (x?: string) => {
      if (x === undefined || x === "") return undefined;
      const n = Number(x);
      return Number.isFinite(n) ? n : undefined;
    };
    return {
      name: name ?? "",
      grams: num(grams),
      calories: num(calories),
      protein_g: num(protein_g),
      carbs_g: num(carbs_g),
      fat_g: num(fat_g),
    };
  });
}

/**
 * Sample row in spreadsheet shape. Used by the "Download template"
 * button so admins start from a working file. Returned as CSV text
 * to keep it dep-free — Excel opens CSVs natively.
 */
export const BULK_RECIPES_CSV_TEMPLATE = [
  "title,description,mealType,calories,proteinGrams,carbsGrams,fatGrams,cookTimeMinutes,diets,allergens,tags,recipeSteps,ingredients",
  [
    `"Greek yogurt bowl"`,
    `"Quick high-protein breakfast"`,
    "breakfast",
    "360",
    "24",
    "48",
    "8",
    "5",
    `"balanced|vegetarian"`,
    `"dairy"`,
    `"high-protein"`,
    `"Spoon yogurt into a bowl.|Top with granola and berries."`,
    `"Greek yogurt:200:130:18:9:5|Granola:40:180:4:28:5|Mixed berries:80:50:1:12:0"`,
  ].join(","),
].join("\n");
