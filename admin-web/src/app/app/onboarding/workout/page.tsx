"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const workoutTypes = [
  { id: "strength", emoji: "🏋️", label: "Strength" },
  { id: "cardio", emoji: "🏃", label: "Cardio" },
  { id: "hiit", emoji: "🔥", label: "HIIT" },
  { id: "yoga", emoji: "🧘", label: "Yoga" },
  { id: "mobility", emoji: "🤸", label: "Mobility" },
  { id: "sports", emoji: "⚽", label: "Sports" },
];

const daysOptions = ["2 days", "3 days", "4 days", "5 days", "6+ days"];
const durationOptions = ["15 min", "30 min", "45 min", "60 min"];

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

function SegmentedPicker({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            selected === opt
              ? "border-accent-purple/60 bg-white/[0.16] text-white"
              : "border-glass-stroke bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingWorkoutPage() {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [days, setDays] = useState("3 days");
  const [duration, setDuration] = useState("30 min");

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleContinue() {
    localStorage.setItem(
      "onboarding_workout",
      JSON.stringify({
        types: selectedTypes,
        days,
        duration,
      }),
    );
    router.push("/app/onboarding/meals");
  }

  return (
    <div className="flex min-h-[80vh] flex-col">
      <StepIndicator current={2} />

      <h1 className="mb-2 text-center text-2xl font-bold text-white">
        Your workout routine
      </h1>
      <p className="mb-8 text-center text-sm text-white/55">
        Help us calculate your nutrition needs
      </p>

      {/* Workout Types */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-white/70">
          Workout types (select all that apply)
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {workoutTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleType(type.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition-all ${
                selectedTypes.includes(type.id)
                  ? "border-accent-purple/60 bg-accent-purple/10"
                  : "border-glass-stroke bg-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              <span className="text-xl">{type.emoji}</span>
              <span className="text-xs font-medium text-white/80">
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Days per week */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-white/70">Days / week</h3>
        <SegmentedPicker options={daysOptions} selected={days} onSelect={setDays} />
      </div>

      {/* Duration */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-white/70">
          Session duration
        </h3>
        <SegmentedPicker
          options={durationOptions}
          selected={duration}
          onSelect={setDuration}
        />
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={handleContinue}
          disabled={selectedTypes.length === 0}
          className="w-full rounded-xl bg-primary-gradient py-3.5 font-semibold text-white shadow-glow transition-opacity disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
