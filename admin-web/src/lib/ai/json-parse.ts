import type { ZodSchema } from "zod";

/**
 * Forgiving JSON parsers shared by every AI call site.
 *
 * Three model misbehaviors we tolerate:
 *
 *   1. The output is wrapped in a markdown code fence
 *      (` ```json\n{...}\n``` `) or has a leading sentence.
 *   2. The output is the right shape but nested under a wrapper key,
 *      e.g. `{"recipe": {"title": "...", ...}}` instead of the flat
 *      `{"title": "...", ...}`. Wrapper key may be one we've seen
 *      before (`recipe`, `data`, `output`...) or one the model
 *      invents (`generated_recipe`, `dish`, ...).
 *   3. Field names are renamed onto plausible synonyms —
 *      `{"ingredient": "chicken", "weight_g": 150}` instead of the
 *      canonical `{"name": "chicken", "grams": 150}`.
 *
 * The helpers below address each case:
 *
 *   - `parseLooseJson(raw)` strips a leading ```/```json fence (and a
 *     trailing one) before calling JSON.parse, falling back to the
 *     first balanced `{...}` block found in the string.
 *
 *   - `normalizeIngredient` / `normalizeRecipeShape` /
 *     `normalizeRecipe` / `normalizePlan` fold common field-name
 *     aliases onto our canonical schema names. Passed to
 *     `parseWithEnvelope` as a `transform` so the renaming runs
 *     against EVERY candidate node (top-level, each known envelope
 *     key, and each BFS-discovered nested object) — that way a
 *     `{output: {recipe: {ingredient: "chicken"}}}` shape still
 *     validates after the BFS finds the inner recipe.
 *
 *     They are intentionally NOT wired into the zod schema via
 *     `z.preprocess`: doing that collapses the inferred output type
 *     to `unknown` inside `z.array(...)` and breaks downstream type
 *     inference (e.g. `for (const meal of plan.meals)` typing).
 *
 *   - `parseWithEnvelope(schema, obj, transform?)` tries, in order:
 *       a. `schema.safeParse(transform(obj))` directly,
 *       b. peel each known envelope key, transform it, retry,
 *       c. BFS the object tree, transform every nested object,
 *          retry the schema.
 *     The first match wins. On total failure it throws an Error whose
 *     message starts with the OBSERVED top-level shape (e.g.
 *     `{recipe, meta}: title: Required`) so the operator can tell
 *     envelope-mismatch from missing-field at a glance.
 *
 *   - `describeShape(obj)` returns a short "{title, recipe, meta}"
 *     summary used by the AI call sites to enrich their 502 error
 *     payloads when validation fails.
 */

const ENVELOPE_KEYS: readonly string[] = [
  "recipe",
  "meal",
  "meal_plan",
  "mealPlan",
  "data",
  "result",
  "output",
  "response",
  "payload",
  "content",
  "body",
  "item",
  "dish",
  "generated_recipe",
  "generatedRecipe",
];

/** How deep we walk into nested objects looking for a schema match. */
const MAX_RECURSION_DEPTH = 4;

/** Identity transform — used as the default when no transform is supplied. */
const identity = (x: unknown): unknown => x;

/**
 * JSON.parse with two forgiveness rules:
 *   1. Strips ` ```json ... ``` ` (or ` ``` ... ``` `) fences.
 *   2. If parse fails, falls back to the first balanced `{...}` or
 *      `[...]` block embedded in the string.
 *
 * Throws SyntaxError if neither approach yields valid JSON.
 */
export function parseLooseJson(raw: string): unknown {
  const trimmed = stripCodeFence(raw.trim());
  try {
    return JSON.parse(trimmed);
  } catch (firstErr) {
    const block = extractFirstJsonBlock(trimmed);
    if (block) {
      try {
        return JSON.parse(block);
      } catch {
        // fall through with the original error message
      }
    }
    throw firstErr;
  }
}

/**
 * Validate `obj` against `schema`. If it doesn't match, peel each
 * envelope key in turn and retry — the model occasionally wraps the
 * payload in `{"recipe": {...}}` or `{"data": {...}}` despite the
 * system prompt asking for a flat object.
 *
 * If still no match, walks the object tree breadth-first up to
 * MAX_RECURSION_DEPTH and tries the schema on each nested object.
 * This catches arbitrary envelope keys the model invents.
 *
 * `transform` is applied to EVERY candidate before `safeParse`, so
 * field-name aliases get folded regardless of how deeply the recipe
 * is wrapped. Defaults to identity.
 *
 * Returns the parsed value on success.
 *
 * On failure, throws an Error whose message starts with the top-level
 * keys observed and the canonical zod issue list.
 */
export function parseWithEnvelope<T>(
  schema: ZodSchema<T>,
  obj: unknown,
  transform: (x: unknown) => unknown = identity,
): T {
  const direct = schema.safeParse(transform(obj));
  if (direct.success) return direct.data;

  // Try the known envelope keys.
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    for (const key of ENVELOPE_KEYS) {
      if (key in record) {
        const peeled = schema.safeParse(transform(record[key]));
        if (peeled.success) return peeled.data;
      }
    }
  }

  // Last resort: BFS the object tree. Catches `{"foo": {"bar": {...recipe...}}}`
  // and `{"customWrapper": {...}}` shapes we haven't enumerated.
  const found = findValidNode(schema, obj, transform);
  if (found.found) return found.value;

  // Total failure. Build a diagnostic message that surfaces both the
  // observed shape and the canonical zod issues.
  const shape = describeShape(obj);
  const message = formatZodIssues(direct.error.issues);
  throw new Error(`${shape}: ${message}`);
}

// ---------------------------------------------------------------------------
// Field-alias normalizers
// ---------------------------------------------------------------------------

/**
 * Map common field-name aliases the model tends to use for an
 * ingredient object onto our canonical schema names so a recipe with
 * `{"ingredient": "chicken", "weight_g": 150, "protein": 30}`
 * validates the same as the canonical
 * `{"name": "chicken", "grams": 150, "protein_g": 30}`.
 *
 * Aliases observed in production failures:
 *   name      ← ingredient | item | food | label
 *   grams     ← weight_g | weight | quantity_g | quantity | amount_g | amount
 *   calories  ← kcal | cal
 *   protein_g ← protein | proteinGrams
 *   carbs_g   ← carbs | carbohydrates_g | carbohydrates | carbsGrams
 *   fat_g     ← fat | fats | fatGrams
 */
export function normalizeIngredient(obj: unknown): unknown {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const o = obj as Record<string, unknown>;
  return {
    ...o,
    name: firstDefined(o, ["name", "ingredient", "item", "food", "label"]),
    grams: coerceNumber(
      firstDefined(o, [
        "grams",
        "weight_g",
        "weight",
        "quantity_g",
        "quantity",
        "amount_g",
        "amount",
      ]),
    ),
    calories: coerceNumber(firstDefined(o, ["calories", "kcal", "cal"])),
    protein_g: coerceNumber(
      firstDefined(o, ["protein_g", "protein", "proteinGrams"]),
    ),
    carbs_g: coerceNumber(
      firstDefined(o, [
        "carbs_g",
        "carbs",
        "carbohydrates_g",
        "carbohydrates",
        "carbsGrams",
      ]),
    ),
    fat_g: coerceNumber(firstDefined(o, ["fat_g", "fat", "fats", "fatGrams"])),
  };
}

/**
 * Same idea for the top-level recipe / meal object: fold camelCase
 * aliases (`mealType`, `proteinGrams`) and a few common synonyms
 * (`steps` → `recipe_steps`) onto the canonical snake_case shape so
 * the model is allowed to be slightly creative without us 502'ing.
 *
 * Does NOT recurse into ingredients[]; use `normalizeRecipe` for that.
 */
export function normalizeRecipeShape(obj: unknown): unknown {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const o = obj as Record<string, unknown>;
  return {
    ...o,
    meal_type: firstDefined(o, ["meal_type", "mealType", "type", "category"]),
    cook_time_minutes: coerceNumber(
      firstDefined(o, [
        "cook_time_minutes",
        "cookTimeMinutes",
        "cook_time",
        "cookTime",
        "prep_time_minutes",
        "prepTimeMinutes",
      ]),
    ),
    calories: coerceNumber(firstDefined(o, ["calories", "kcal", "cal"])),
    protein_g: coerceNumber(
      firstDefined(o, ["protein_g", "protein", "proteinGrams"]),
    ),
    carbs_g: coerceNumber(
      firstDefined(o, [
        "carbs_g",
        "carbs",
        "carbohydrates_g",
        "carbohydrates",
        "carbsGrams",
      ]),
    ),
    fat_g: coerceNumber(firstDefined(o, ["fat_g", "fat", "fats", "fatGrams"])),
    recipe_steps: firstDefined(o, [
      "recipe_steps",
      "recipeSteps",
      "steps",
      "instructions",
      "directions",
      "method",
    ]),
    image_prompt: firstDefined(o, [
      "image_prompt",
      "imagePrompt",
      "image_description",
    ]),
  };
}

/**
 * Recipe-shape normalizer for the single-recipe call site
 * (`generateRecipeForAdmin`). Applies `normalizeRecipeShape` at the
 * top AND maps `normalizeIngredient` over `ingredients[]` so each
 * sub-object's alias keys are renamed too.
 */
export function normalizeRecipe(obj: unknown): unknown {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const top = normalizeRecipeShape(obj) as Record<string, unknown>;
  const ingredients = top.ingredients;
  if (Array.isArray(ingredients)) {
    top.ingredients = ingredients.map(normalizeIngredient);
  }
  return top;
}

/**
 * Plan-shape normalizer for the meal-plan call site. The plan object
 * has a `meals: Array<Recipe>`; we normalize each meal as a recipe so
 * the inner ingredients[] aliases are folded too.
 *
 * If the input doesn't look like a plan (no `meals` array), returns
 * it unchanged so `parseWithEnvelope`'s envelope/BFS phases can keep
 * unwrapping. This is what makes shapes like
 * `{output: {meals: [...]}}` work — BFS visits `output`,
 * `normalizePlan(output)` returns `output` unchanged (it has the
 * right shape), schema matches.
 */
export function normalizePlan(obj: unknown): unknown {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o.meals)) return obj;
  return {
    ...o,
    meals: o.meals.map(normalizeRecipe),
  };
}

function firstDefined(
  obj: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const k of keys) {
    if (k in obj && obj[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  return undefined;
}

/**
 * Coerce a value into a number when possible. The model occasionally
 * returns numeric fields as strings (`"150"` instead of `150`),
 * which then fails zod's `z.number()` check downstream — apply this
 * to known-numeric ingredient/recipe fields inside the normalizers
 * so the downstream schemas don't have to relax their types.
 *
 * Strings are parsed via `Number()` after stripping anything other
 * than digits, dot, and minus (catches `"150g"` or `"150 grams"`
 * occasionally emitted alongside the unit). Returns the original
 * value when coercion isn't possible so zod can emit its normal
 * "expected number" message.
 */
function coerceNumber(v: unknown): unknown {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return v;
    // Fast path: pure number
    const direct = Number(trimmed);
    if (Number.isFinite(direct)) return direct;
    // Strip units like "150g" or "1,200 kcal".
    const cleaned = trimmed.replace(/[^\d.\-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return v;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : v;
  }
  return v;
}

/**
 * Short human-readable summary of an unknown value's shape, used in
 * error payloads so operators can see what the model returned without
 * dumping the full body.
 *
 * Examples:
 *   `{recipe, meta}` — top-level keys
 *   `[{title, ...}, ...]` — array
 *   `string`, `number`, `null`
 */
export function describeShape(obj: unknown): string {
  if (obj === null) return "null";
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return `[${describeShape(obj[0])}${obj.length > 1 ? ", ..." : ""}]`;
  }
  if (typeof obj === "object") {
    const keys = Object.keys(obj as Record<string, unknown>);
    if (keys.length === 0) return "{}";
    const preview = keys.slice(0, 6).join(", ");
    return `{${preview}${keys.length > 6 ? ", ..." : ""}}`;
  }
  return typeof obj;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

interface SearchHit<T> {
  found: true;
  value: T;
}
interface SearchMiss {
  found: false;
}

function findValidNode<T>(
  schema: ZodSchema<T>,
  root: unknown,
  transform: (x: unknown) => unknown,
): SearchHit<T> | SearchMiss {
  const queue: Array<{ node: unknown; depth: number }> = [
    { node: root, depth: 0 },
  ];
  const seen = new Set<unknown>();
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (depth > MAX_RECURSION_DEPTH) continue;
    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (!Array.isArray(node)) {
      const probe = schema.safeParse(transform(node));
      if (probe.success) return { found: true, value: probe.data };
    }

    // Enqueue children.
    if (Array.isArray(node)) {
      for (const child of node) {
        if (child && typeof child === "object") {
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    } else {
      for (const child of Object.values(node as Record<string, unknown>)) {
        if (child && typeof child === "object") {
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    }
  }
  return { found: false };
}

function stripCodeFence(s: string): string {
  // Match ```json\n...\n``` or ```\n...\n``` (with optional language).
  const fenced = /^```(?:json|javascript|js)?\s*\n([\s\S]*?)\n```\s*$/i.exec(s);
  if (fenced) return fenced[1].trim();
  return s;
}

function extractFirstJsonBlock(s: string): string | null {
  // Find the first '{' or '[' and walk forward, tracking depth +
  // string state, until the matching closer. Good enough for the
  // "model added a sentence before/after the JSON" failure mode.
  for (let start = 0; start < s.length; start += 1) {
    const ch = s[start];
    if (ch === "{" || ch === "[") {
      const end = findBalancedEnd(s, start);
      if (end !== -1) {
        return s.slice(start, end + 1);
      }
    }
  }
  return null;
}

function findBalancedEnd(s: string, start: number): number {
  const opener = s[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i += 1) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === opener) depth += 1;
    else if (c === closer) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function formatZodIssues(issues: ReadonlyArray<{
  path: ReadonlyArray<string | number>;
  message: string;
  code?: string;
}>): string {
  // Pick the top 3 issues, formatted as "path.to.field: message".
  return issues
    .slice(0, 3)
    .map((iss) => {
      const path = iss.path.length > 0 ? iss.path.join(".") : "(root)";
      return `${path}: ${iss.message}`;
    })
    .join("; ");
}
