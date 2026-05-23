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
 *      "title: undefined - schema invalid" error: the model returned
 *      the recipe under a "recipe" envelope and `Schema.parse` on the
 *      outer object correctly failed because it had no `title` field.
 *   3. A wrapper key we haven't seen before — the model invents new
 *      ones occasionally (`generated_recipe`, `output`, `dish`,
 *      `payload`, etc).
 *
 * The two helpers below address each case:
 *
 *   - `parseLooseJson(raw)` strips a leading ```/```json fence (and a
 *     trailing one) before calling JSON.parse, falling back to the
 *     first balanced `{...}` block found in the string.
 *
 *   - `parseWithEnvelope(schema, obj)` tries, in order:
 *       a. `schema.safeParse(obj)` directly,
 *       b. peeling each "known" envelope key (recipe / meal / data /
 *          result / output / response / ...),
 *       c. recursively walking every nested object up to a small
 *          depth and trying the schema on each (catches arbitrary
 *          wrappers we haven't enumerated).
 *     The first match wins. On total failure it throws an Error whose
 *     message contains the top-level keys we observed AND the
 *     canonical zod issue list, so the operator can see whether the
 *     model invented a new envelope key or returned the wrong fields
 *     entirely.
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
 * Returns the parsed value on success.
 *
 * On failure, throws an Error whose message starts with the top-level
 * keys observed (e.g. `"recipe envelope shape was {recipe} but its
 * inner object also failed: ..."`) so the operator can immediately
 * see whether the model invented a new wrapper or returned wrong
 * fields entirely.
 */
export function parseWithEnvelope<T>(
  schema: ZodSchema<T>,
  obj: unknown,
): T {
  const direct = schema.safeParse(obj);
  if (direct.success) return direct.data;

  // Try the known envelope keys.
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    for (const key of ENVELOPE_KEYS) {
      if (key in record) {
        const peeled = schema.safeParse(record[key]);
        if (peeled.success) return peeled.data;
      }
    }
  }

  // Last resort: BFS the object tree. Catches `{"foo": {"bar": {...recipe...}}}`
  // and `{"customWrapper": {...}}` shapes we haven't enumerated.
  const found = findValidNode(schema, obj);
  if (found.found) return found.value;

  // Total failure. Build a diagnostic message that surfaces both the
  // observed shape and the canonical zod issues.
  const shape = describeShape(obj);
  const message = formatZodIssues(direct.error.issues);
  throw new Error(`${shape}: ${message}`);
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
      const probe = schema.safeParse(node);
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
