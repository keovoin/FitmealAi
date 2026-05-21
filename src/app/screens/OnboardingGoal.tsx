import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton, SegmentedControl } from "../components/ui";

export function OnboardingGoal() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("Lose Weight");
  const [calories, setCalories] = useState(2000);
  const [activity, setActivity] = useState("Active");

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-6 h-full"
    >
      <div className="mt-12 mb-2 text-center">
        <h1 className="text-[28px] font-bold mb-2">What is your goal?</h1>
        <p className="text-[16px] text-white/70">We will create your meal and workout plan around it.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {["Goal", "Workout", "Meal"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i === 0
                  ? "bg-gradient-to-br from-[#8F5CFF] to-[#4F8CFF] text-white shadow-[0_0_12px_rgba(143,92,255,0.5)]"
                  : "bg-white/10 text-white/40"
              }`}>{i + 1}</div>
              <span className={`text-[10px] font-medium ${i === 0 ? "text-white" : "text-white/40"}`}>{label}</span>
            </div>
            {i < 2 && <div className="w-8 h-px mb-4 bg-white/15" />}
          </div>
        ))}
      </div>

      <GlassCard className="flex-1 flex flex-col gap-8">
        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">Primary Goal</label>
          <SegmentedControl 
            options={["Lose Weight", "Maintain", "Gain Muscle"]} 
            value={goal} 
            onChange={setGoal} 
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-white/70 font-medium">Daily Calorie Target</label>
            <span className="text-[#8F5CFF] font-bold">{calories} kcal</span>
          </div>
          <input 
            type="range" 
            min="1400" max="3200" step="50"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#8F5CFF]"
          />
        </div>

        <div>
          <label className="text-sm text-white/70 font-medium mb-3 block">Activity Level</label>
          <div className="flex flex-col gap-3">
            {["Beginner", "Active", "Athlete"].map((level) => (
              <button
                key={level}
                onClick={() => setActivity(level)}
                className={`w-full py-4 px-5 rounded-[16px] flex justify-between items-center transition-all ${
                  activity === level 
                    ? "bg-gradient-to-r from-white/20 to-white/10 border-white/40 shadow-inner" 
                    : "bg-white/5 border-white/10"
                } border`}
              >
                <span className="font-medium">{level}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  activity === level ? "border-[#8F5CFF]" : "border-white/30"
                }`}>
                  {activity === level && <div className="w-2.5 h-2.5 bg-[#8F5CFF] rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <PrimaryButton onClick={() => navigate("/onboarding/workout")}>
            Continue
          </PrimaryButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
