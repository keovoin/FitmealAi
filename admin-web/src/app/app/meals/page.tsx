"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/user/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

interface Ingredient {
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface Meal {
  meal_type: string;
  title: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: Ingredient[];
  recipe_steps: string[];
}

interface DayTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}


function NutritionTotals({ totals }: { totals: DayTotals }) {
  return (
    <div className="glass-card p-4">
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-white">{totals.calories}</p>
          <p className="text-[10px] text-white/55">kcal</p>
        </div>
        <div>
          <p className="text-lg font-bold text-accent-blue">{totals.protein_g}g</p>
          <p className="text-[10px] text-white/55">Protein</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gold-start">{totals.carbs_g}g</p>
          <p className="text-[10px] text-white/55">Carbs</p>
        </div>
        <div>
          <p className="text-lg font-bold text-success">{totals.fat_g}g</p>
          <p className="text-[10px] text-white/55">Fat</p>
        </div>
      </div>
    </div>
  );
}


function MealCard({ meal }: { meal: Meal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="glass-card w-full p-4 text-left transition-colors hover:bg-white/[0.08]"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-purple">
            {meal.meal_type}
          </span>
          <span className="text-[15px] font-medium text-white">
            {meal.title}
          </span>
          <div className="mt-1 flex gap-2">
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-white/70">
              {meal.calories} kcal
            </span>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-accent-blue">
              P {meal.protein_g}g
            </span>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-gold-start">
              C {meal.carbs_g}g
            </span>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-success">
              F {meal.fat_g}g
            </span>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>


      {expanded && (
        <div className="mt-4 border-t border-white/10 pt-4">
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold text-white/70">
                Ingredients
              </h4>
              <ul className="space-y-1">
                {meal.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-accent-purple" />
                    {ing.name} ({ing.grams}g) - {ing.calories} kcal
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meal.recipe_steps && meal.recipe_steps.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-white/70">
                Steps
              </h4>
              <ol className="space-y-1">
                {meal.recipe_steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-white/60">
                    <span className="flex-shrink-0 font-medium text-accent-purple">
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {(!meal.ingredients || meal.ingredients.length === 0) &&
            (!meal.recipe_steps || meal.recipe_steps.length === 0) && (
              <p className="text-xs text-white/40">
                No recipe details available
              </p>
            )}
        </div>
      )}
    </button>
  );
}


function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-white/10" />
      <div className="glass-card h-20 animate-pulse" />
      <div className="glass-card h-28 animate-pulse" />
      <div className="glass-card h-28 animate-pulse" />
      <div className="glass-card h-28 animate-pulse" />
    </div>
  );
}

export default function MealsPage() {
  const { user, session } = useAuth();
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<DayTotals>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);


  async function fetchPlan() {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const date = getDateString(tab === "today" ? 0 : 1);

      // Get the active meal plan for the date (not superseded)
      const { data: planData } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", user!.id)
        .eq("plan_date", date)
        .is("superseded_at", null)
        .limit(1)
        .maybeSingle();

      if (!planData) {
        setMeals([]);
        setTotals({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
        return;
      }

      // Get meal_plan_items joined with meals table
      const { data: items } = await supabase
        .from("meal_plan_items")
        .select("position, calories, protein_g, carbs_g, fat_g, meals(title, meal_type, ingredients, recipe_steps)")
        .eq("meal_plan_id", planData.id)
        .order("position", { ascending: true });

      if (!items || items.length === 0) {
        setMeals([]);
        setTotals({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
        return;
      }

      const parsedMeals: Meal[] = items.map((item: Record<string, unknown>) => {
        const meal = item.meals as Record<string, unknown> | null;
        return {
          meal_type: (meal?.meal_type as string) || "meal",
          title: (meal?.title as string) || "Untitled",
          calories: (item.calories as number) || 0,
          protein_g: (item.protein_g as number) || 0,
          carbs_g: (item.carbs_g as number) || 0,
          fat_g: (item.fat_g as number) || 0,
          ingredients: (meal?.ingredients as Ingredient[]) || [],
          recipe_steps: (meal?.recipe_steps as string[]) || [],
        };
      });

      const computedTotals = parsedMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein_g: acc.protein_g + m.protein_g,
          carbs_g: acc.carbs_g + m.carbs_g,
          fat_g: acc.fat_g + m.fat_g,
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      );

      setMeals(parsedMeals);
      setTotals(computedTotals);
    } catch (err) {
      console.error("Failed to fetch meals:", err);
    } finally {
      setLoading(false);
    }
  }


  async function handleRegenerate() {
    if (!user || !session) return;
    setRegenerating(true);
    try {
      const supabase = getSupabaseBrowser();

      // Get user preferences to build the full request body
      const [goalsRes, mealPrefsRes] = await Promise.all([
        supabase
          .from("user_goals")
          .select("fitness_goal, daily_calorie_target")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("meal_prefs")
          .select("diets, timings, cook_time, allergies")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),
      ]);

      const date = getDateString(tab === "today" ? 0 : 1);

      const body = {
        user_id: user.id,
        goal: goalsRes.data?.fitness_goal || "stay_fit",
        daily_calorie_target: goalsRes.data?.daily_calorie_target || 2000,
        diets: mealPrefsRes.data?.diets || ["balanced"],
        allergies: mealPrefsRes.data?.allergies || [],
        cook_time: mealPrefsRes.data?.cook_time || "30 min",
        meal_types: mealPrefsRes.data?.timings || ["breakfast", "lunch", "dinner"],
        date,
        reuse_today_if_present: false,
      };

      const res = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Regeneration failed");
      await fetchPlan();
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setRegenerating(false);
    }
  }


  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <h1 className="text-[22px] font-bold text-white">My Meals</h1>

      {/* Tab Picker */}
      <div className="flex gap-2">
        {(["today", "tomorrow"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full border py-2 text-sm font-medium capitalize transition-all ${
              tab === t
                ? "border-accent-purple/60 bg-white/[0.16] text-white"
                : "border-glass-stroke bg-white/[0.06] text-white/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : meals.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-8">
          <span className="text-4xl">&#127869;</span>
          <p className="text-center text-sm text-white/55">
            No meal plan for {tab}. Generate one from the home page!
          </p>
        </div>
      ) : (
        <>
          {/* Nutrition Totals */}
          <NutritionTotals totals={totals} />

          {/* Meal Cards */}
          <div className="flex flex-col gap-3">
            {meals.map((meal, i) => (
              <MealCard key={i} meal={meal} />
            ))}
          </div>

          {/* Regenerate */}
          {tab === "today" && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="glass-pill w-full py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.12] disabled:opacity-40"
            >
              {regenerating ? "Regenerating..." : "Regenerate today's plan"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function getDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}
