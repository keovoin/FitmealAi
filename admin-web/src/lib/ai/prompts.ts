import type { MealPlanRequest } from "./types";

/**
 * System and user prompt for the meal plan endpoint. Kept terse to
 * minimize input tokens; the JSON-mode response_format does the heavy
 * lifting on output structure.
 */

export function buildMealPlanSystemPrompt(): string {
  return [
    "You are a registered dietitian's assistant for the FitMeal AI app.",
    "Generate realistic, easy-to-cook home meal plans that:",
    "  - Hit the user's calorie target within +/- 8% across the day",
    "  - Use 4 kcal/g for protein and carbs, 9 kcal/g for fat - macro totals MUST be internally consistent with calories",
    "  - Respect dietary preferences and exclude every allergy",
    "  - Use ingredients available in mainstream supermarkets",
    "  - Provide grams, calories, and macros per ingredient",
    "  - Keep recipe steps short (1-2 sentences each), no fluff",
    "Output EXCLUSIVELY a single JSON object that matches the schema. Do not wrap in markdown.",
    'CRITICAL: The top-level JSON object must have exactly ONE key: "meals", whose value is the array of meal objects. Do NOT wrap the response under "data", "result", "meal_plan", "response", or any other envelope key.',
    "For each meal, include an `image_prompt` of 1-2 sentences describing the finished dish on a plate, ready for a photographer.",
  ].join("\n");
}

export function buildMealPlanUserPrompt(req: MealPlanRequest): string {
  const dailyKcal = req.daily_calorie_target;
  const types = req.meal_types.join(", ");
  const diets = req.diets.join(", ");
  const allergies =
    req.allergies.length === 0 ? "none" : req.allergies.join(", ");

  return [
    `Goal: ${humanizeGoal(req.goal)}.`,
    `Daily calorie target: ${dailyKcal} kcal.`,
    `Diet styles to follow: ${diets}.`,
    `Allergies to STRICTLY avoid: ${allergies}.`,
    `Maximum cook time per meal: ${req.cook_time}.`,
    `Generate exactly these meals for ${req.date}: ${types}.`,
    "",
    "Distribute the daily calories sensibly across the requested meals (e.g. lighter breakfast, slightly heavier dinner).",
    "Each meal must have at least 3 ingredients and at least 2 recipe steps.",
  ].join("\n");
}

/**
 * Image-generation prompt fed into the Images API. We append a fixed
 * style suffix so cached images across a user's day feel consistent.
 */
export function buildImagePrompt(mealImagePrompt: string, mealTitle: string): string {
  return [
    mealImagePrompt,
    "Top-down food photo, soft natural light, neutral wooden table,",
    "shallow depth of field, vibrant color, magazine quality, 1:1 framing.",
    `Dish: ${mealTitle}.`,
  ].join(" ");
}

function humanizeGoal(goal: MealPlanRequest["goal"]): string {
  switch (goal) {
    case "lose_weight":
      return "lose weight";
    case "build_muscle":
      return "build muscle";
    case "stay_fit":
      return "stay fit";
    case "eat_healthier":
      return "eat healthier";
  }
}
