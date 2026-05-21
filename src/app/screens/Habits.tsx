import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard, SecondaryGlassButton } from "../components/ui";
import { Droplets, Footprints, Moon, Dumbbell, Plus } from "lucide-react";

export function Habits() {
  const [habits, setHabits] = useState([
    { id: 1, name: "Drink 2L Water", icon: Droplets, color: "blue", done: true },
    { id: 2, name: "Walk 5,000 Steps", icon: Footprints, color: "orange", done: false },
    { id: 3, name: "Sleep 8 hours", icon: Moon, color: "indigo", done: false },
    { id: 4, name: "Stretch 5 min", icon: Dumbbell, color: "pink", done: false },
  ]);

  const toggle = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const doneCount = habits.filter(h => h.done).length;
  const allDone = doneCount === habits.length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full gap-6 overflow-y-auto no-scrollbar pb-24"
    >
      <header>
        <h1 className="text-[28px] font-bold mb-1">Habits</h1>
        <p className="text-white/70">Small steps, big results.</p>
      </header>

      <GlassCard className={`!p-6 flex flex-col items-center justify-center text-center transition-all duration-500 ${allDone ? 'shadow-[0_0_40px_rgba(52,211,153,0.3)] border-[#34D399]/50' : ''}`}>
        <div className="text-sm font-medium text-white/70 mb-2 uppercase tracking-widest">Daily Streak</div>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">12</span>
          <span className="text-lg text-white/60">days</span>
        </div>
        {allDone && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-3 text-[#34D399] font-medium text-sm flex items-center gap-1.5">
            Perfect day completed! 🎉
          </motion.div>
        )}
      </GlassCard>

      <div className="flex flex-col gap-3">
        {habits.map((habit) => {
          const Icon = habit.icon;
          return (
            <motion.div key={habit.id} layout>
              <GlassCard 
                className={`!p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${habit.done ? "bg-white/[0.15] border-white/30" : ""}`}
                onClick={() => toggle(habit.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                    ${habit.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''}
                    ${habit.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : ''}
                    ${habit.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' : ''}
                    ${habit.color === 'pink' ? 'bg-pink-500/20 text-pink-400' : ''}
                  `}>
                    <Icon size={22} />
                  </div>
                  <span className={`font-semibold text-[16px] ${habit.done ? "text-white/80" : ""}`}>{habit.name}</span>
                </div>
                
                <motion.div 
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${habit.done ? "border-[#34D399] bg-[#34D399]" : "border-white/30"}`}
                  animate={habit.done ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {habit.done && <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></motion.svg>}
                </motion.div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <SecondaryGlassButton className="mt-2 border-dashed border-white/30 text-white/70 hover:text-white">
        <Plus size={18} className="mr-2" /> Add Custom Habit
      </SecondaryGlassButton>
    </motion.div>
  );
}
