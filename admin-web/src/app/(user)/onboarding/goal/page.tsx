"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const goals = [
  { id: "lose_weight", emoji: "🔥", label: "Lose weight" },
  { id: "build_muscle", emoji: "💪", label: "Build muscle" },
  { id: "stay_fit", emoji: "🏃", label: "Stay fit" },
  { id: "eat_healthier", emoji: "🥗", label: "Eat healthier" },
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

export default function OnboardingGoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  function handleContinue() {
    if (!selected) return;
    localStorage.setItem("onboarding_goal", selected);
    router.push("/onboarding/workout");
  }

  return (
    <div className="flex min-h-[80vh] flex-col">
      <StepIndicator current={1} />

      <h1 className="mb-2 text-center text-2xl font-bold text-white">
        What&apos;s your goal?
      </h1>
      <p className="mb-8 text-center text-sm text-white/55">
        We&apos;ll personalize your meal plans based on this
      </p>

      <div className="flex flex-col gap-3">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => setSelected(goal.id)}
            className={`glass-card flex items-center gap-4 px-5 py-4 text-left transition-all ${
              selected === goal.id
                ? "border-accent-purple/60 bg-accent-purple/10"
                : "hover:bg-white/[0.08]"
            }`}
          >
            <span className="text-2xl">{goal.emoji}</span>
            <span className="text-[15px] font-medium text-white">
              {goal.label}
            </span>
            {selected === goal.id && (
              <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-purple">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full rounded-xl bg-primary-gradient py-3.5 font-semibold text-white shadow-glow transition-opacity disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
