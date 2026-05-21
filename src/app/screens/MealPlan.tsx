import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard, SegmentedControl, SecondaryGlassButton } from "../components/ui";
import { UtensilsCrossed } from "lucide-react";

export function MealPlan() {
  const [tab, setTab] = useState("Today");

  const meals = [
    { type: "Breakfast", name: "Avocado Toast & Egg", cals: 320, p: 14, c: 35, f: 16, img: "https://images.unsplash.com/photo-1525351484163-9e45e5212259?auto=format&fit=crop&q=80&w=200" },
    { type: "Lunch", name: "Grilled Chicken Salad", cals: 450, p: 35, c: 20, f: 18, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200" },
    { type: "Dinner", name: "Salmon with Quinoa", cals: 520, p: 40, c: 45, f: 22, img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=200" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full gap-6 overflow-y-auto no-scrollbar pb-24"
    >
      <header>
        <h1 className="text-[28px] font-bold mb-4">Meal Plan</h1>
        <SegmentedControl options={["Today", "Tomorrow", "Weekly"]} value={tab} onChange={setTab} />
      </header>

      {tab === "Weekly" ? (
        <GlassCard className="flex flex-col items-center justify-center py-12 text-center border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 text-white/50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Weekly Plan Locked</h3>
            <p className="text-sm text-white/60 mb-6">Upgrade to Silver or Gold to unlock full 7-day AI planning.</p>
            <SecondaryGlassButton className="!w-auto px-6">View Plans</SecondaryGlassButton>
          </div>
          <div className="opacity-20 pointer-events-none w-full space-y-4 filter blur-sm">
             <div className="h-24 bg-white/5 rounded-2xl w-full" />
             <div className="h-24 bg-white/5 rounded-2xl w-full" />
          </div>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4">
          <GlassCard className="!p-4 bg-gradient-to-r from-[#4F8CFF]/10 to-[#8F5CFF]/10 border-[#8F5CFF]/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white/80">Daily Target</span>
              <span className="font-bold">1290 / 1850 kcal</span>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <div className="text-xs text-white/60 mb-1">Protein</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-400 w-[60%]" /></div>
                <div className="text-xs font-medium mt-1">89g</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/60 mb-1">Carbs</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-400 w-[45%]" /></div>
                <div className="text-xs font-medium mt-1">100g</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/60 mb-1">Fat</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-orange-400 w-[55%]" /></div>
                <div className="text-xs font-medium mt-1">56g</div>
              </div>
            </div>
          </GlassCard>

          {meals.map((meal, idx) => (
            <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}>
              <GlassCard className="!p-4 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-[16px] overflow-hidden shrink-0 bg-white/5">
                    <img src={meal.img} alt={meal.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold text-[#8F5CFF] uppercase tracking-wider mb-1">{meal.type}</div>
                    <h3 className="font-bold text-[15px] mb-1 leading-tight">{meal.name}</h3>
                    <div className="text-sm text-white/60">{meal.cals} kcal</div>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                  <div className="text-xs text-white/50 flex gap-3">
                    <span>P: {meal.p}g</span>
                    <span>C: {meal.c}g</span>
                    <span>F: {meal.f}g</span>
                  </div>
                  <button className="text-xs font-medium flex items-center gap-1.5 text-white/70 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">
                    <UtensilsCrossed size={12} /> Replace
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
