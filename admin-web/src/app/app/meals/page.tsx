"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/user/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

interface Meal {
  type: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  steps?: string[];
}

interface DayPlan {
  meals: Meal[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
}

function NutritionTotals({
  totals,
}: {
  totals: { calories: number; protein: number; carbs: number; fat: number };
}) {
  return (
    <div className="glass-card p-4">
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-white">{totals.calories}</p>
          <p className="text-[10px] text-white/55">kcal</p>
        </div>
        <div>
          <p className="text-lg font-bold text-accent-blue">{totals.protein}g</p>
          <p className="text-[10px] text-white/55">Protein</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gold-start">{totals.carbs}g</p>
          <p className="text-[10px] text-white/55">Carbs</p>
        </div>
        <div>
          <p className="text-lg font-bold text-success">{totals.fat}g</p>
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
            {meal.type}
          </span>
          <span className="text-[15px] font-medium text-white">
            {meal.title}
          </span>
          <div className="mt-1 flex gap-2">
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-white/70">
              {meal.calories} kcal
            </span>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-accent-blue">
              P {meal.protein}g
            </span>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-gold-start">
              C {meal.carbs}g
            </span>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-success">
              F {meal.fat}g
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
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meal.steps && meal.steps.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-white/70">
                Steps
              </h4>
              <ol className="space-y-1">
                {meal.steps.map((step, i) => (
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
            (!meal.steps || meal.steps.length === 0) && (
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
  const { user } = useAuth();
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

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
      const { data } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date)
        .limit(1)
        .maybeSingle();

      if (data) {
        setPlan({
          meals: data.meals || [],
          totals: data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        });
      } else {
        setPlan(null);
      }
    } catch (err) {
      console.error("Failed to fetch meals:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!user) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, regenerate: true }),
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
      ) : !plan ? (
        <div className="glass-card flex flex-col items-center gap-3 p-8">
          <span className="text-4xl">🍽️</span>
          <p className="text-center text-sm text-white/55">
            No meal plan for {tab}. Generate one from the home page!
          </p>
        </div>
      ) : (
        <>
          {/* Nutrition Totals */}
          <NutritionTotals totals={plan.totals} />

          {/* Meal Cards */}
          <div className="flex flex-col gap-3">
            {plan.meals.map((meal, i) => (
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
