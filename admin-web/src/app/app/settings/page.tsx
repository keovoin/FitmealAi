"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/user/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

interface UserPrefs {
  fitness_goal?: string;
  daily_calorie_target?: number;
  workout_types?: string[];
  workout_days?: string;
  workout_duration?: string;
  diets?: string[];
  timings?: string[];
  cook_time?: string;
  allergies?: string[];
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<UserPrefs>({});
  const [tier, setTier] = useState<string>("free");
  const [signingOut, setSigningOut] = useState(false);


  useEffect(() => {
    if (!user) return;
    fetchPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchPrefs() {
    try {
      const supabase = getSupabaseBrowser();

      const [goalsRes, mealPrefsRes, workoutRes, quotaRes] = await Promise.all([
        supabase
          .from("user_goals")
          .select("fitness_goal, daily_calorie_target")
          .eq("user_id", user!.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("meal_prefs")
          .select("diets, timings, cook_time, allergies")
          .eq("user_id", user!.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("workout_prefs")
          .select("types, days, duration")
          .eq("user_id", user!.id)
          .limit(1)
          .maybeSingle(),
        fetch(`/api/quotas?user_id=${user!.id}`).then((r) => r.json()),
      ]);

      setPrefs({
        fitness_goal: goalsRes.data?.fitness_goal,
        daily_calorie_target: goalsRes.data?.daily_calorie_target,
        workout_types: workoutRes.data?.types,
        workout_days: workoutRes.data?.days,
        workout_duration: workoutRes.data?.duration,
        diets: mealPrefsRes.data?.diets,
        timings: mealPrefsRes.data?.timings,
        cook_time: mealPrefsRes.data?.cook_time,
        allergies: mealPrefsRes.data?.allergies,
      });
      setTier(quotaRes?.tier || "free");
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/app/signin");
  }


  const initials =
    user?.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold text-white">Settings</h1>

      {/* Account Header */}
      <div className="glass-card flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-gradient text-lg font-bold text-white">
          {initials}
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-white">
            {displayName}
          </span>
          <span className="text-sm text-white/55">{user?.email}</span>
        </div>
      </div>

      {/* Plan */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-white/70">Current plan</span>
            <p className="text-[15px] font-semibold capitalize text-white">
              {tier === "free" ? "Free" : tier}
            </p>
          </div>
          {tier === "free" && (
            <button
              onClick={() => router.push("/app/paywall")}
              className="rounded-full bg-gold-gradient px-4 py-1.5 text-xs font-semibold text-slate-900"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>


      {/* Preferences */}
      <div className="glass-card p-5">
        <h3 className="mb-4 text-sm font-medium text-white/70">Preferences</h3>

        <div className="flex flex-col gap-3">
          {/* Goal */}
          {prefs.fitness_goal && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Goal</span>
              <span className="text-sm capitalize text-white">
                {prefs.fitness_goal.replace(/_/g, " ")}
              </span>
            </div>
          )}

          {/* Calorie Target */}
          {prefs.daily_calorie_target && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Daily Calories</span>
              <span className="text-sm text-white">
                {prefs.daily_calorie_target} kcal
              </span>
            </div>
          )}

          {/* Workout Types */}
          {prefs.workout_types && prefs.workout_types.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Workouts</span>
              <span className="text-sm capitalize text-white">
                {prefs.workout_types.slice(0, 3).join(", ")}
                {prefs.workout_types.length > 3 && "..."}
              </span>
            </div>
          )}

          {/* Workout Frequency */}
          {prefs.workout_days && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Frequency</span>
              <span className="text-sm text-white">{prefs.workout_days}</span>
            </div>
          )}

          {/* Workout Duration */}
          {prefs.workout_duration && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Duration</span>
              <span className="text-sm text-white">{prefs.workout_duration}</span>
            </div>
          )}

          {/* Diets */}
          {prefs.diets && prefs.diets.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Diet</span>
              <span className="text-sm capitalize text-white">
                {prefs.diets.slice(0, 2).join(", ").replace(/_/g, " ")}
                {prefs.diets.length > 2 && "..."}
              </span>
            </div>
          )}

          {/* Meal Timings */}
          {prefs.timings && prefs.timings.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Meals</span>
              <span className="text-sm capitalize text-white">
                {prefs.timings.join(", ")}
              </span>
            </div>
          )}

          {/* Cook Time */}
          {prefs.cook_time && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Cook time</span>
              <span className="text-sm text-white">{prefs.cook_time}</span>
            </div>
          )}

          {/* Allergies */}
          {prefs.allergies && prefs.allergies.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Allergies</span>
              <span className="text-sm capitalize text-white">
                {prefs.allergies.join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>


      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full rounded-xl border border-danger/40 bg-danger/10 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-40"
      >
        {signingOut ? "Signing out..." : "Sign Out"}
      </button>

      {/* Version Footer */}
      <p className="text-center text-[11px] text-white/30">
        FitMeal AI Web v1.0.0
      </p>
    </div>
  );
}
