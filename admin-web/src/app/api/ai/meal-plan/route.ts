import { generateMealPlan } from "@/lib/ai/meal-plan-service";
import { isAIConfigured } from "@/lib/ai/openai";
import { MealPlanRequestSchema } from "@/lib/ai/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Pin to Node runtime: uses Supabase service-role client + OpenAI SDK.
// Both rely on Node-only APIs and would crash on Edge.
export const runtime = "nodejs";
// Allow up to 60 seconds for the full text+image generation pass.
export const maxDuration = 60;

/**
 * POST /api/ai/meal-plan
 *
 * Generates (or reuses) a daily meal plan for the supplied user.
 * Phase 4c requires a Supabase JWT in Authorization and verifies the
 * body user_id matches the authenticated user.
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "supabase_not_configured" },
      { status: 503 },
    );
  }
  if (!isAIConfigured()) {
    return NextResponse.json(
      { ok: false, error: "ai_not_configured" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "missing_authorization" },
      { status: 401 },
    );
  }

  const { data: authData, error: authError } = await getSupabaseAdmin().auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json(
      { ok: false, error: "invalid_authorization" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = MealPlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.user_id !== authData.user.id) {
    return NextResponse.json(
      { ok: false, error: "user_mismatch" },
      { status: 403 },
    );
  }

  const result = await generateMealPlan(parsed.data);
  if (!result.ok) {
    const headers: Record<string, string> = {};
    if (result.retry_after_seconds) {
      headers["retry-after"] = String(result.retry_after_seconds);
    }
    return NextResponse.json(
      {
        ok: false,
        error: result.reason,
        retry_after_seconds: result.retry_after_seconds,
      },
      { status: result.status, headers },
    );
  }

  return NextResponse.json(result);
}

// Also expose GET as a 405 so debugging from a browser is clearer.
export function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "use_POST",
      example_body: {
        user_id: "uuid-of-the-user",
        goal: "lose_weight",
        daily_calorie_target: 2000,
        diets: ["balanced"],
        allergies: [],
        cook_time: "30 min",
        meal_types: ["breakfast", "lunch", "dinner"],
        date: "2026-05-22",
        reuse_today_if_present: true,
      },
    },
    { status: 405 },
  );
}
