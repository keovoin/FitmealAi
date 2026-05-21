import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";
import { Check, Play, Square } from "lucide-react";

export function Workout() {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const exercises = [
    { name: "Jumping Jacks", duration: "60 sec" },
    { name: "Push-ups", duration: "3 sets x 12 reps" },
    { name: "Bodyweight Squats", duration: "3 sets x 15 reps" },
    { name: "Plank", duration: "60 sec" },
    { name: "Lunges", duration: "3 sets x 10/leg" }
  ];

  const toggleComplete = (idx: number) => {
    if (completed.includes(idx)) {
      setCompleted(completed.filter(i => i !== idx));
    } else {
      setCompleted([...completed, idx]);
    }
  };

  const progress = completed.length / exercises.length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full gap-6 overflow-y-auto no-scrollbar pb-24"
    >
      <header>
        <h1 className="text-[28px] font-bold mb-1">Workout</h1>
        <p className="text-white/70">Full Body · 30 min · <span className="text-[#34D399]">Beginner</span></p>
      </header>

      <GlassCard className="!p-0 overflow-hidden shrink-0 relative">
        <div className="h-40 w-full relative">
          <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400" alt="Workout" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <div className="text-white/70 text-sm font-medium mb-1">Completion</div>
              <div className="text-2xl font-bold">{Math.round(progress * 100)}%</div>
            </div>
            {started ? (
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center backdrop-blur-md cursor-pointer border border-red-500/30" onClick={() => setStarted(false)}>
                <Square size={18} fill="currentColor" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#4F8CFF] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(79,140,255,0.5)] cursor-pointer" onClick={() => setStarted(true)}>
                <Play size={20} fill="currentColor" className="ml-1" />
              </div>
            )}
          </div>
        </div>
        <div className="h-1.5 w-full bg-white/10">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#4F8CFF] to-[#8F5CFF]" 
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </GlassCard>

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-lg mb-1">Exercises</h3>
        {exercises.map((ex, idx) => {
          const isDone = completed.includes(idx);
          return (
            <GlassCard 
              key={idx} 
              className={`!p-4 flex items-center justify-between cursor-pointer transition-all ${isDone ? "opacity-60 bg-white/5 border-white/5" : ""}`}
              onClick={() => toggleComplete(idx)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 ${isDone ? "bg-[#34D399]/20 text-[#34D399]" : "bg-white/10 text-white/50"}`}>
                  <span className="font-bold text-lg">{idx + 1}</span>
                </div>
                <div>
                  <h4 className={`font-semibold text-[15px] ${isDone ? "line-through text-white/70" : ""}`}>{ex.name}</h4>
                  <div className="text-sm text-white/50 mt-0.5">{ex.duration}</div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? "border-[#34D399] bg-[#34D399]" : "border-white/30"}`}>
                {isDone && <Check size={14} className="text-black" strokeWidth={3} />}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {progress === 1 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4">
          <PrimaryButton>Finish Workout</PrimaryButton>
        </motion.div>
      )}
    </motion.div>
  );
}
