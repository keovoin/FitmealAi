"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/user/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

interface QuotaData {
  tier: string;
  ai: { used: number; limit: number; unlimited: boolean };
  shuffles: { used: number; limit: number; unlimited: boolean };
  shuffle_meal_count: number;
}

interface MealSummary {
  meal_type: string;
  title: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const pct = Math.min((consumed / goal) * 100, 100);
  const remaining = Math.max(goal - consumed, 0);

  return (
    <div className="glass-card flex items-center gap-5 p-5">
      <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />

          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="url(#ring-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${pct * 2.51} 251`}
          />
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F8CFF" />
              <stop offset="100%" stopColor="#8F5CFF" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute text-center">
          <span className="text-lg font-bold text-white">{consumed}</span>
          <span className="block text-[10px] text-white/55">kcal</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-white/55">Daily goal</span>
        <span className="text-lg font-semibold text-white">
          {goal.toLocaleString()} kcal
        </span>
        <span className="text-sm text-success">
          {remaining.toLocaleString()} remaining
        </span>
      </div>
    </div>
  );
}


function MealsSummaryCard({ meals }: { meals: MealSummary[] }) {
  const router = useRouter();

  if (meals.length === 0) {
    return (
      <div className="glass-card p-5">
        <p className="text-center text-sm text-white/55">
          No meal plan yet. Generate one below!
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push("/app/meals")}
      className="glass-card w-full p-5 text-left transition-colors hover:bg-white/[0.08]"
    >
      <h3 className="mb-3 text-sm font-medium text-white/70">
        Today&apos;s Meals
      </h3>
      <div className="flex flex-col gap-2">
        {meals.slice(0, 3).map((meal, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-accent-purple">
                {meal.meal_type}
              </span>
              <span className="text-sm text-white">{meal.title}</span>
            </div>
            <span className="text-xs text-white/55">{meal.calories} kcal</span>
          </div>
        ))}
      </div>
      {meals.length > 3 && (
        <p className="mt-2 text-xs text-accent-blue">
          +{meals.length - 3} more
        </p>
      )}
    </button>
  );
}


function UpgradeBanner() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/app/paywall")}
      className="w-full rounded-card border border-gold-start/40 bg-gradient-to-r from-gold-start/10 to-gold-end/10 p-4 text-left transition-colors hover:from-gold-start/15 hover:to-gold-end/15"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">&#10024;</span>
        <div>
          <p className="text-sm font-semibold text-white">
            Unlock unlimited meals
          </p>
          <p className="text-xs text-white/55">
            Upgrade to Gold for personalized plans daily
          </p>
        </div>
        <svg
          className="ml-auto h-5 w-5 text-gold-start"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-48 animate-pulse rounded-lg bg-white/10" />
      <div className="h-4 w-32 animate-pulse rounded-lg bg-white/10" />
      <div className="glass-card h-32 animate-pulse" />
      <div className="glass-card h-24 animate-pulse" />
      <div className="h-16 animate-pulse rounded-card bg-white/[0.04]" />
    </div>
  );
}


export default function HomePage() {
  const { user, session } = useAuth();
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const greeting = getGreeting();
  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  useEffect(() => {
    if (!user) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchData() {
    try {
      const supabase = getSupabaseBrowser();

      const [quotaRes, goalsRes] = await Promise.all([
        fetch(`/api/quotas?user_id=${user!.id}`).then((r) => r.json()),
        supabase
          .from("user_goals")
          .select("daily_calorie_target")
          .eq("user_id", user!.id)
          .limit(1)
          .maybeSingle(),
      ]);

      setQuota(quotaRes);
      if (goalsRes.data?.daily_calorie_target) {
        setCalorieGoal(goalsRes.data.daily_calorie_target);
      }

      // Fetch today's meal plan
      const todayMeals = await fetchTodayPlan(supabase);
      setMeals(todayMeals);
    } catch (err) {
      console.error("Failed to fetch home data:", err);
    } finally {
      setLoading(false);
    }
  }


  async function fetchTodayPlan(supabase: ReturnType<typeof getSupabaseBrowser>): Promise<MealSummary[]> {
    const today = new Date().toISOString().split("T")[0];

    // Get the active meal plan for today (not superseded)
    const { data: planData } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user!.id)
      .eq("plan_date", today)
      .is("superseded_at", null)
      .limit(1)
      .maybeSingle();

    if (!planData) return [];

    // Get meal_plan_items joined with meals
    const { data: items } = await supabase
      .from("meal_plan_items")
      .select("position, calories, protein_g, carbs_g, fat_g, meals(title, meal_type)")
      .eq("meal_plan_id", planData.id)
      .order("position", { ascending: true });

    if (!items || items.length === 0) return [];

    return items.map((item: Record<string, unknown>) => {
      const meal = item.meals as Record<string, unknown> | null;
      return {
        meal_type: (meal?.meal_type as string) || "meal",
        title: (meal?.title as string) || "Untitled",
        calories: (item.calories as number) || 0,
        protein_g: (item.protein_g as number) || 0,
        carbs_g: (item.carbs_g as number) || 0,
        fat_g: (item.fat_g as number) || 0,
      };
    });
  }


  async function handleGenerate() {
    if (!user || !session) return;
    setGenerating(true);
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

      const today = new Date().toISOString().split("T")[0];

      const body = {
        user_id: user.id,
        goal: goalsRes.data?.fitness_goal || "stay_fit",
        daily_calorie_target: goalsRes.data?.daily_calorie_target || 2000,
        diets: mealPrefsRes.data?.diets || ["balanced"],
        allergies: mealPrefsRes.data?.allergies || [],
        cook_time: mealPrefsRes.data?.cook_time || "30 min",
        meal_types: mealPrefsRes.data?.timings || ["breakfast", "lunch", "dinner"],
        date: today,
        reuse_today_if_present: true,
      };

      const res = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Generation failed");
      await fetchData();
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  }


  if (loading) return <LoadingSkeleton />;

  const consumed = meals.reduce((sum, m) => sum + m.calories, 0);
  const aiRemaining = quota?.ai.unlimited
    ? "Unlimited"
    : quota
      ? `${Math.max(quota.ai.limit - quota.ai.used, 0)} left`
      : "";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-white">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-white/55">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Calorie Ring */}
      <CalorieRing consumed={consumed} goal={calorieGoal} />

      {/* Today's Meals */}
      <MealsSummaryCard meals={meals} />

      {/* Upgrade Banner for Free users */}
      {quota?.tier === "free" && <UpgradeBanner />}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || (!quota?.ai.unlimited && quota?.ai.used === quota?.ai.limit)}
        className="w-full rounded-xl bg-primary-gradient py-3.5 font-semibold text-white shadow-glow transition-opacity disabled:opacity-40"
      >
        {generating ? "Generating..." : `Generate ${aiRemaining ? `(${aiRemaining})` : ""}`}
      </button>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
