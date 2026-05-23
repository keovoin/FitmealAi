"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiGenerateRecipeAction } from "@/lib/supabase/admin-actions";
import type { MealType, RecipeWriteInput } from "@/lib/supabase/recipes-shared";
import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const DIET_PRESETS = [
  "balanced",
  "high-protein",
  "low-carb",
  "keto",
  "vegetarian",
  "vegan",
  "pescatarian",
  "gluten-free",
];

const ALLERGEN_PRESETS = [
  "nuts",
  "dairy",
  "eggs",
  "gluten",
  "soy",
  "shellfish",
];

const CALORIE_PRESETS_BY_MEAL: Record<MealType, number> = {
  breakfast: 380,
  lunch: 520,
  dinner: 620,
  snack: 220,
};

/**
 * Compact panel that sits at the top of /recipes/new. Admin picks
 * a meal type, a few diet/allergen tags, an (optional) title hint,
 * and clicks Generate. Result populates the parent RecipeForm via
 * `onGenerated` so the human can review and tweak before saving.
 *
 * Why "fill the form" instead of "save directly":
 *   - admins almost always want to read the AI output before letting
 *     it ship to mobile users
 *   - re-using the existing form keeps validation, status transitions,
 *     macro-sum mismatch warnings, and image upload UI in one place
 */
export function AIGeneratePanel({
  onGenerated,
}: {
  onGenerated: (recipe: RecipeWriteInput, warnings: string[]) => void;
}) {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [titleHint, setTitleHint] = useState("");
  const [calorieTarget, setCalorieTarget] = useState<number>(
    CALORIE_PRESETS_BY_MEAL.lunch,
  );
  const [diets, setDiets] = useState<string[]>(["balanced"]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [withImage, setWithImage] = useState(true);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<string>("30");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function pickMealType(next: MealType) {
    setMealType(next);
    setCalorieTarget(CALORIE_PRESETS_BY_MEAL[next]);
  }

  function toggleArr(
    arr: string[],
    setter: (next: string[]) => void,
    value: string,
  ) {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  function generate() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const cookCap = cookTimeMinutes.trim() === ""
        ? undefined
        : Number(cookTimeMinutes);
      const res = await aiGenerateRecipeAction({
        mealType,
        titleHint: titleHint.trim() || undefined,
        calorieTarget,
        diets: diets.length === 0 ? ["balanced"] : diets,
        allergens,
        withImage,
        cookTimeMinutes:
          Number.isFinite(cookCap) && (cookCap as number) > 0
            ? (cookCap as number)
            : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onGenerated(res.result.recipe, res.result.warnings);
      setInfo(
        res.result.warnings.length > 0
          ? `Generated with caveats: ${res.result.warnings.join("; ")}`
          : "Form populated. Review and click Create draft to save.",
      );
    });
  }

  return (
    <div
      className="rounded-xl border border-accent-purple/30 bg-accent-purple/[0.06] p-4"
      data-testid="ai-generate-panel"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-purple/30 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Generate with AI</p>
          <p className="mt-0.5 text-xs text-white/65">
            Pre-fills the form with a single AI-generated draft. Review and
            tweak before publishing — nothing saves automatically.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="space-y-1 text-xs text-white/60">
          <span>Meal type</span>
          <select
            value={mealType}
            onChange={(e) => pickMealType(e.target.value as MealType)}
            className="glass-input h-9 w-full text-sm"
            data-testid="ai-meal-type"
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m[0].toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-white/60">
          <span>Per-serving calories</span>
          <input
            type="number"
            min={50}
            max={2500}
            step={10}
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value || 0))}
            className="glass-input h-9 w-full text-sm"
            data-testid="ai-calorie-target"
          />
        </label>
        <label className="space-y-1 text-xs text-white/60">
          <span>Cook time cap (min, optional)</span>
          <input
            type="number"
            min={1}
            max={240}
            step={5}
            value={cookTimeMinutes}
            onChange={(e) => setCookTimeMinutes(e.target.value)}
            placeholder="30"
            className="glass-input h-9 w-full text-sm"
          />
        </label>
      </div>

      <label className="mt-3 block space-y-1 text-xs text-white/60">
        <span>Title hint (optional)</span>
        <input
          value={titleHint}
          onChange={(e) => setTitleHint(e.target.value)}
          placeholder="High-protein post-workout bowl"
          className="glass-input h-9 w-full text-sm"
          data-testid="ai-title-hint"
        />
      </label>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wider text-white/45">Diets</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {DIET_PRESETS.map((d) => {
            const on = diets.includes(d);
            return (
              <button
                type="button"
                key={d}
                onClick={() => toggleArr(diets, setDiets, d)}
                className={`glass-pill px-2.5 py-1 text-[11px] ${
                  on
                    ? "bg-accent-purple/30 text-white border border-accent-purple/50"
                    : "text-white/65 hover:bg-white/[0.10] hover:text-white"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wider text-white/45">
          Allergens to avoid
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ALLERGEN_PRESETS.map((a) => {
            const on = allergens.includes(a);
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggleArr(allergens, setAllergens, a)}
                className={`glass-pill px-2.5 py-1 text-[11px] ${
                  on
                    ? "bg-danger/30 text-white border border-danger/50"
                    : "text-white/65 hover:bg-white/[0.10] hover:text-white"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={withImage}
            onChange={(e) => setWithImage(e.target.checked)}
          />
          Also generate a hero image (~5-15 seconds, ~$0.04)
        </label>
        <Button
          type="button"
          size="sm"
          variant="primary"
          loading={pending}
          onClick={generate}
          leftIcon={<Sparkles className="h-3 w-3" />}
          data-testid="ai-generate-button"
        >
          {pending ? "Generating…" : "Generate"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-red-300" data-testid="ai-generate-error">
          {error}
        </p>
      )}
      {info && !error && (
        <p className="mt-2 text-[11px] text-white/70">
          <Badge tone="green">Done</Badge> {info}
        </p>
      )}
    </div>
  );
}
