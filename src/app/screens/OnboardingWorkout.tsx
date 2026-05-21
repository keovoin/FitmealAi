import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";

const WORKOUT_TYPES = [
  { id: "strength", label: "Strength", icon: "🏋️" },
  { id: "cardio", label: "Cardio", icon: "🏃" },
  { id: "hiit", label: "HIIT", icon: "⚡" },
  { id: "yoga", label: "Yoga", icon: "🧘" },
  { id: "pilates", label: "Pilates", icon: "🤸" },
  { id: "cycling", label: "Cycling", icon: "🚴" },
  { id: "running", label: "Running", icon: "👟" },
  { id: "swimming", label: "Swimming", icon: "🏊" },
  { id: "boxing", label: "Boxing", icon: "🥊" },
  { id: "stretching", label: "Stretching", icon: "🙆" },
];

const DAYS_OPTIONS = ["2 days", "3 days", "4 days", "5 days", "6 days"];
const DURATION_OPTIONS = ["20 min", "30 min", "45 min", "60 min", "90 min"];

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

export function OnboardingWorkout() {
  const navigate = useNavigate();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["strength"]);
  const [days, setDays] = useState("4 days");
  const [duration, setDuration] = useState("45 min");

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id)
        ? prev.length === 1 ? prev : prev.filter((t) => t !== id)
        : [...prev, id]
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
        <h1 className="text-[28px] font-bold mb-2">Your workout style</h1>
        <p className="text-[16px] text-white/70">Pick everything that fits — mix & match freely.</p>
      </div>

      <StepIndicator current={1} />

      <GlassCard className="flex-1 flex flex-col gap-7 overflow-y-auto no-scrollbar">
        {/* Workout types - multi select */}
        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">
            Workout Types <span className="text-white/40">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WORKOUT_TYPES.map((type) => {
              const active = selectedTypes.includes(type.id);
              return (
                <motion.button
                  key={type.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleType(type.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-[#8F5CFF]/30 to-[#4F8CFF]/20 border-[#8F5CFF]/60 text-white shadow-[0_0_8px_rgba(143,92,255,0.25)]"
                      : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                  {active && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-[#8F5CFF] flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Days per week */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-white/70 font-medium">Days Per Week</label>
            <span className="text-[#8F5CFF] font-bold text-sm">{days}</span>
          </div>
          <div className="flex bg-white/[0.08] p-1 rounded-[14px] border border-white/10 gap-0.5">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-2.5 text-xs font-medium rounded-[10px] transition-all duration-200 ${
                  days === d
                    ? "bg-white/20 text-white shadow-sm backdrop-blur-md"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                {d.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Session duration */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-white/70 font-medium">Session Duration</label>
            <span className="text-[#4F8CFF] font-bold text-sm">{duration}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 min-w-[56px] py-2.5 rounded-[12px] text-sm font-medium border transition-all duration-200 ${
                  duration === d
                    ? "bg-[#4F8CFF]/30 border-[#4F8CFF]/60 text-white"
                    : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <div className="text-center text-xs text-white/40 mb-4">
            {selectedTypes.length} workout type{selectedTypes.length !== 1 ? "s" : ""} selected
          </div>
          <PrimaryButton onClick={() => navigate("/onboarding/meal")}>
            Continue
          </PrimaryButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
