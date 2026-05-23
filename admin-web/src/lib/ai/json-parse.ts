import type { ZodSchema } from "zod";

/**
 * Forgiving JSON parsers shared by every AI call site.
 *
 * Why this exists:
 *
 * Even with `response_format: { type: "json_object" }`, models will
 * occasionally return:
 *
 *   1. A bare JSON object wrapped in a markdown code fence
 *      (` ```json\n{...}\n``` `), or with a leading sentence.
 *   2. The right shape but nested under a wrapper key, e.g.
 *      `{"recipe": {"title": "...", ...}}` instead of the flat
 *      `{"title": "...", ...}`. This was causing the production
 *      "title: undefined — schema invalid" error: the model returned
 *      the recipe under a "recipe" envelope and `Schema.parse` on the
 *      outer object correctly failed because it had no `title` field.
 *
 * The two helpers below address each case:
 *
 *   - `parseLooseJson(raw)` strips a leading ```/```json fence (and a
 *     trailing one) before calling JSON.parse, falling back to the
 *     first balanced `{...}` block found in the string.
 *
 *   - `parseWithEnvelope(schema, obj)` first tries `schema.parse(obj)`
 *     directly. On failure it peels common envelope keys
 *     (`recipe`, `meal`, `meal_plan`, `data`, `result`, `output`,
 *     `response`) and retries against each. The first one that
 *     validates wins; if none do, the original schema error is
 *     re-thrown so the caller sees the canonical zod message.
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
];

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
 * Returns the parsed value on success.
 *
 * On failure, throws the FIRST zod error (against the unwrapped obj)
 * so callers and logs see the canonical "expected X at .title"
 * message rather than a confusing message about a wrapper key.
 */
export function parseWithEnvelope<T>(
  schema: ZodSchema<T>,
  obj: unknown,
): T {
  const direct = schema.safeParse(obj);
  if (direct.success) return direct.data;

  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    for (const key of ENVELOPE_KEYS) {
      if (key in record) {
        const peeled = schema.safeParse(record[key]);
        if (peeled.success) return peeled.data;
      }
    }

    // Last-resort: if the object has exactly one key and that key's
    // value is itself an object, try peeling it. Catches one-off
    // envelopes the model invents (e.g. `{"generated_recipe": {...}}`)
    // that aren't in our static list.
    const keys = Object.keys(record);
    if (keys.length === 1) {
      const onlyValue = record[keys[0]];
      if (onlyValue && typeof onlyValue === "object") {
        const peeled = schema.safeParse(onlyValue);
        if (peeled.success) return peeled.data;
      }
    }
  }

  // Re-throw the original error so the message reflects the actual
  // shape mismatch the operator needs to see.
  throw direct.error;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

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
