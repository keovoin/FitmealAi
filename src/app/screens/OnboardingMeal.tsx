import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";

const DIET_TYPES = [
  { id: "balanced", label: "Balanced", icon: "⚖️", desc: "Everything in moderation" },
  { id: "high-protein", label: "High Protein", icon: "🥩", desc: "Muscle-building focused" },
  { id: "low-carb", label: "Low Carb", icon: "🥦", desc: "Reduce carbohydrates" },
  { id: "keto", label: "Keto", icon: "🧀", desc: "Very low carb, high fat" },
  { id: "vegan", label: "Vegan", icon: "🌱", desc: "100% plant-based" },
  { id: "vegetarian", label: "Vegetarian", icon: "🥗", desc: "No meat or fish" },
  { id: "mediterranean", label: "Mediterranean", icon: "🫒", desc: "Whole foods & healthy fats" },
  { id: "paleo", label: "Paleo", icon: "🍖", desc: "Like our ancestors ate" },
];

const MEAL_TIMINGS = [
  { id: "breakfast", label: "Breakfast", time: "7–9 AM", icon: "🌅" },
  { id: "morning-snack", label: "Morning Snack", time: "10–11 AM", icon: "🍎" },
  { id: "lunch", label: "Lunch", time: "12–1 PM", icon: "☀️" },
  { id: "afternoon-snack", label: "Afternoon Snack", time: "3–4 PM", icon: "🥜" },
  { id: "dinner", label: "Dinner", time: "6–8 PM", icon: "🌙" },
  { id: "evening-snack", label: "Evening Snack", time: "After 8 PM", icon: "🫐" },
];

const COOK_TIMES = ["< 15 min", "30 min", "45 min", "1 hr+"];
const ALLERGY_TAGS = ["Peanuts", "Tree Nuts", "Gluten", "Dairy", "Eggs", "Shellfish", "Soy", "Fish"];

const STEP_LABELS = ["Goal", "Workout", "Meal"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < current
                ? "bg-[#8F5CFF] text-white"
                : i === current
                ? "bg-gradient-to-br from-[#8F5CFF] to-[#4F8CFF] text-white shadow-[0_0_12px_rgba(143,92,255,0.5)]"
                : "bg-white/10 text-white/40"
            }`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] font-medium ${i === current ? "text-white" : "text-white/40"}`}>{label}</span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`w-8 h-px mb-4 transition-all duration-300 ${i < current ? "bg-[#8F5CFF]" : "bg-white/15"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function OnboardingMeal() {
  const navigate = useNavigate();
  const [selectedDiets, setSelectedDiets] = useState<string[]>(["balanced"]);
  const [selectedTimings, setSelectedTimings] = useState<string[]>(["breakfast", "lunch", "dinner"]);
  const [cookTime, setCookTime] = useState("30 min");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  function toggleDiet(id: string) {
    setSelectedDiets((prev) =>
      prev.includes(id)
        ? prev.length === 1 ? prev : prev.filter((d) => d !== id)
        : [...prev, id]
    );
  }

  function toggleTiming(id: string) {
    setSelectedTimings((prev) =>
      prev.includes(id)
        ? prev.length === 1 ? prev : prev.filter((t) => t !== id)
        : [...prev, id]
    );
  }

  function toggleAllergy(tag: string) {
    setSelectedAllergies((prev) =>
      prev.includes(tag) ? prev.filter((a) => a !== tag) : [...prev, tag]
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-6 h-full"
    >
      <div className="mt-12 mb-2 text-center">
        <h1 className="text-[28px] font-bold mb-2">Set up your meals</h1>
        <p className="text-[16px] text-white/70">Choose your preferences — mix styles freely.</p>
      </div>

      <StepIndicator current={2} />

      <GlassCard className="flex-1 flex flex-col gap-7 overflow-y-auto no-scrollbar">
        {/* Diet types - multi select grid cards */}
        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">
            Diet Style <span className="text-white/40">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DIET_TYPES.map((diet) => {
              const active = selectedDiets.includes(diet.id);
              return (
                <motion.button
                  key={diet.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleDiet(diet.id)}
                  className={`flex flex-col items-start gap-1 px-4 py-3 rounded-[14px] border transition-all duration-200 text-left ${
                    active
                      ? "bg-gradient-to-br from-[#8F5CFF]/30 to-[#4F8CFF]/15 border-[#8F5CFF]/60 shadow-[0_0_8px_rgba(143,92,255,0.2)]"
                      : "bg-white/5 border-white/15 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{diet.icon}</span>
                    {active && (
                      <div className="w-4 h-4 rounded-full bg-[#8F5CFF] flex items-center justify-center shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${active ? "text-white" : "text-white/80"}`}>{diet.label}</span>
                  <span className="text-xs text-white/40 leading-tight">{diet.desc}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Meal timings - multi select */}
        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">
            When do you eat? <span className="text-white/40">(tap to toggle)</span>
          </label>
          <div className="flex flex-col gap-2">
            {MEAL_TIMINGS.map((timing) => {
              const active = selectedTimings.includes(timing.id);
              return (
                <motion.button
                  key={timing.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleTiming(timing.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-[#34D399]/20 to-[#34D399]/5 border-[#34D399]/50 text-white"
                      : "bg-white/5 border-white/15 text-white/60 hover:bg-white/8"
                  }`}
                >
                  <span className="text-base">{timing.icon}</span>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${active ? "text-white" : "text-white/70"}`}>{timing.label}</div>
                    <div className="text-xs text-white/40">{timing.time}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                    active ? "border-[#34D399] bg-[#34D399]" : "border-white/25"
                  }`}>
                    {active && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5L3.5 6.5L7.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Cook time */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-white/70 font-medium">Max Cook Time</label>
            <span className="text-[#4F8CFF] font-bold text-sm">{cookTime}</span>
          </div>
          <div className="flex bg-white/[0.08] p-1 rounded-[14px] border border-white/10 gap-0.5">
            {COOK_TIMES.map((t) => (
              <button
                key={t}
                onClick={() => setCookTime(t)}
                className={`flex-1 py-2.5 text-xs font-medium rounded-[10px] transition-all duration-200 ${
                  cookTime === t
                    ? "bg-white/20 text-white shadow-sm backdrop-blur-md"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">
            Allergies / Avoid <span className="text-white/40">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_TAGS.map((tag) => {
              const active = selectedAllergies.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleAllergy(tag)}
                  className={`py-2 px-4 rounded-full text-sm font-medium border transition-all duration-200 ${
                    active
                      ? "bg-red-500/20 border-red-400/50 text-red-300"
                      : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {active ? "✕ " : ""}{tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <div className="text-center text-xs text-white/40 mb-4">
            {selectedTimings.length} meal slot{selectedTimings.length !== 1 ? "s" : ""} · {selectedDiets.length} diet style{selectedDiets.length !== 1 ? "s" : ""}
          </div>
          <PrimaryButton onClick={() => navigate("/generating")}>
            Create My Plan
          </PrimaryButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
