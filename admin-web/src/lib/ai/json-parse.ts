/**
 * Tolerant JSON parser for LLM chat-completion output.
 *
 * Even with `response_format: { type: "json_object" }`, some models
 * (notably gpt-4.1 and various OpenAI-compatible gateway providers)
 * occasionally wrap their JSON in a markdown fence:
 *
 *     ```json
 *     { "title": "..." }
 *     ```
 *
 * or in a plain backtick fence with no language tag. A naive
 * `JSON.parse()` chokes on the leading backtick. We strip fences
 * before parsing so the recipe / meal-plan generators don't fail
 * intermittently on otherwise-valid output.
 *
 * Pure / isomorphic — no server-only imports.
 */

const FENCE_RE = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/;

/**
 * Extract the JSON payload from a raw chat completion `content`
 * field, stripping a single surrounding markdown fence if present.
 * Returns the (trimmed) input verbatim when no fence is detected.
 */
export function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const m = trimmed.match(FENCE_RE);
  return m ? m[1].trim() : trimmed;
}

/**
 * `JSON.parse(stripJsonFences(raw))`. Throws the same `SyntaxError`
 * the bare parser would; callers that want to render a friendlier
 * message should catch and use `err.message`.
 */
export function parseLooseJson(raw: string): unknown {
  return JSON.parse(stripJsonFences(raw));
}
