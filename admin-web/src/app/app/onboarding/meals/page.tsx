"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/user/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const diets = [
  { id: "balanced", emoji: "⚖️", label: "Balanced" },
  { id: "high_protein", emoji: "🥩", label: "High Protein" },
  { id: "low_carb", emoji: "🥦", label: "Low Carb" },
  { id: "keto", emoji: "🧀", label: "Keto" },
  { id: "vegetarian", emoji: "🥕", label: "Vegetarian" },
  { id: "vegan", emoji: "🌱", label: "Vegan" },
  { id: "pescatarian", emoji: "🐟", label: "Pescatarian" },
  { id: "mediterranean", emoji: "🫒", label: "Mediterranean" },
];

const mealTimings = [
  { id: "breakfast", emoji: "☀️", label: "Breakfast" },
  { id: "lunch", emoji: "🥗", label: "Lunch" },
  { id: "dinner", emoji: "🌙", label: "Dinner" },
  { id: "snack", emoji: "🍎", label: "Snack" },
];

const cookTimeOptions = ["15 min", "30 min", "45 min", "60 min"];

const allergies = [
  { id: "nuts", emoji: "🥜", label: "Nuts" },
  { id: "dairy", emoji: "🥛", label: "Dairy" },
  { id: "eggs", emoji: "🥚", label: "Eggs" },
  { id: "gluten", emoji: "🌾", label: "Gluten" },
  { id: "shellfish", emoji: "🦐", label: "Shellfish" },
  { id: "soy", emoji: "🌱", label: "Soy" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-3">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            step === current
              ? "bg-accent-purple"
              : step < current
                ? "bg-accent-purple/50"
                : "border border-white/20 bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingMealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedTimings, setSelectedTimings] = useState<string[]>([]);
  const [cookTime, setCookTime] = useState("30 min");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleItem(
    id: string,
    state: string[],
    setter: (s: string[]) => void,
  ) {
    setter(
      state.includes(id) ? state.filter((t) => t !== id) : [...state, id],
    );
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);

    try {
      const supabase = getSupabaseBrowser();
      const goal = localStorage.getItem("onboarding_goal") || "stay_fit";
      const workoutRaw = localStorage.getItem("onboarding_workout");
      const workout = workoutRaw
        ? JSON.parse(workoutRaw)
        : { types: [], days: "3 days", duration: "30 min" };

      // Save user_goals
      await supabase.from("user_goals").upsert(
        {
          user_id: user.id,
          goal,
          workout_types: workout.types,
          workout_days: workout.days,
          workout_duration: workout.duration,
        },
        { onConflict: "user_id" },
      );

      // Save meal_prefs
      await supabase.from("meal_prefs").upsert(
        {
          user_id: user.id,
          diets: selectedDiets,
          meal_timings: selectedTimings,
          cook_time: cookTime,
          allergies: selectedAllergies,
        },
        { onConflict: "user_id" },
      );

      // Clean up localStorage
      localStorage.removeItem("onboarding_goal");
      localStorage.removeItem("onboarding_workout");

      router.replace("/app/home");
    } catch (err) {
      console.error("Failed to save onboarding:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col pb-8">
      <StepIndicator current={3} />

      <h1 className="mb-2 text-center text-2xl font-bold text-white">
        Meal preferences
      </h1>
      <p className="mb-8 text-center text-sm text-white/55">
        Almost done! Tell us how you like to eat
      </p>

      {/* Diets */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-white/70">
          Diet style (select any)
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {diets.map((diet) => (
            <button
              key={diet.id}
              onClick={() =>
                toggleItem(diet.id, selectedDiets, setSelectedDiets)
              }
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition-all ${
                selectedDiets.includes(diet.id)
                  ? "border-accent-purple/60 bg-accent-purple/10"
                  : "border-glass-stroke bg-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              <span className="text-lg">{diet.emoji}</span>
              <span className="text-[10px] font-medium leading-tight text-white/80">
                {diet.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Meal timings */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-white/70">Meals</h3>
        <div className="grid grid-cols-4 gap-2">
          {mealTimings.map((timing) => (
            <button
              key={timing.id}
              onClick={() =>
                toggleItem(timing.id, selectedTimings, setSelectedTimings)
              }
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition-all ${
                selectedTimings.includes(timing.id)
                  ? "border-accent-purple/60 bg-accent-purple/10"
                  : "border-glass-stroke bg-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              <span className="text-lg">{timing.emoji}</span>
              <span className="text-[10px] font-medium text-white/80">
                {timing.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cook time */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-white/70">
          Max cook time
        </h3>
        <div className="flex flex-wrap gap-2">
          {cookTimeOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setCookTime(opt)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                cookTime === opt
                  ? "border-accent-purple/60 bg-white/[0.16] text-white"
                  : "border-glass-stroke bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-white/70">
          Allergies (optional)
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {allergies.map((allergy) => (
            <button
              key={allergy.id}
              onClick={() =>
                toggleItem(allergy.id, selectedAllergies, setSelectedAllergies)
              }
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all ${
                selectedAllergies.includes(allergy.id)
                  ? "border-accent-purple/60 bg-accent-purple/10"
                  : "border-glass-stroke bg-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              <span className="text-base">{allergy.emoji}</span>
              <span className="text-xs font-medium text-white/80">
                {allergy.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={handleFinish}
          disabled={saving || selectedDiets.length === 0 || selectedTimings.length === 0}
          className="w-full rounded-xl bg-primary-gradient py-3.5 font-semibold text-white shadow-glow transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving..." : "Finish setup"}
        </button>
      </div>
    </div>
  );
}
