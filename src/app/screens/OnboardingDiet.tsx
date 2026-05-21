import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";

export function OnboardingDiet() {
  const navigate = useNavigate();
  const [diet, setDiet] = useState("Balanced");
  const [meals, setMeals] = useState("3 meals");
  const [allergy, setAllergy] = useState("");

  const diets = ["Balanced", "High Protein", "Low Carb", "Vegetarian", "Budget Meal"];
  const mealOptions = ["3 meals", "4 meals", "5 meals"];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-6 h-full"
    >
      <div className="mt-12 mb-8 text-center">
        <h1 className="text-[28px] font-bold mb-2">Choose your food style</h1>
        <p className="text-[16px] text-white/70">Personalize your meal plan</p>
      </div>

      <GlassCard className="flex-1 flex flex-col gap-8">
        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">Diet Preferences</label>
          <div className="flex flex-wrap gap-2">
            {diets.map((d) => (
              <button
                key={d}
                onClick={() => setDiet(d)}
                className={`py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 border ${
                  diet === d 
                    ? "bg-[#4F8CFF] border-[#8F5CFF] text-white shadow-[0_4px_12px_rgba(79,140,255,0.4)]" 
                    : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">Meals Per Day</label>
          <div className="flex bg-white/[0.08] p-1 rounded-[16px] border border-white/10">
            {mealOptions.map((m) => (
              <button
                key={m}
                onClick={() => setMeals(m)}
                className={`flex-1 py-3 text-sm font-medium rounded-[12px] transition-all duration-200 ${
                  meals === m 
                    ? "bg-white/20 text-white shadow-sm backdrop-blur-md" 
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">Allergies / Dislikes (Optional)</label>
          <input 
            type="text" 
            placeholder="e.g. Peanuts, Seafood, Dairy" 
            value={allergy}
            onChange={(e) => setAllergy(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-[16px] px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#4F8CFF] focus:bg-white/10 transition-colors"
          />
        </div>

        <div className="mt-auto pt-4">
          <PrimaryButton onClick={() => navigate("/generating")}>
            Create Plan
          </PrimaryButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
