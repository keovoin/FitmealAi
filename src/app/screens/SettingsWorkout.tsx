import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";
import { ArrowLeft, Check } from "lucide-react";
import { getWorkoutPrefs, saveWorkoutPrefs } from "../store/preferences";

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

export function SettingsWorkout() {
  const navigate = useNavigate();
  const saved = getWorkoutPrefs();

  const [selectedTypes, setSelectedTypes] = useState<string[]>(saved.types);
  const [days, setDays] = useState(saved.days);
  const [duration, setDuration] = useState(saved.duration);
  const [saved_, setSaved_] = useState(false);

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id)
        ? prev.length === 1 ? prev : prev.filter((t) => t !== id)
        : [...prev, id]
    );
  }

  function handleSave() {
    saveWorkoutPrefs({ types: selectedTypes, days, duration });
    setSaved_(true);
    setTimeout(() => setSaved_(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/15 transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-[22px] font-bold leading-tight">Workout Preferences</h1>
          <p className="text-sm text-white/50">Your saved settings from setup</p>
        </div>
      </div>

      <GlassCard className="flex-1 flex flex-col gap-7 overflow-y-auto no-scrollbar">
        {/* Workout types */}
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
          <PrimaryButton onClick={handleSave} className={saved_ ? "!from-[#34D399] !to-[#059669]" : ""}>
            <span className="flex items-center gap-2">
              {saved_ ? <><Check size={16} /> Saved!</> : "Save Changes"}
            </span>
          </PrimaryButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
