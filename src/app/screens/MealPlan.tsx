import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard, SegmentedControl, SecondaryGlassButton } from "../components/ui";
import { UtensilsCrossed, X, ChevronRight, Flame } from "lucide-react";

interface Ingredient {
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  type: string;
  name: string;
  cals: number;
  p: number;
  c: number;
  f: number;
  img: string;
  prepTime: string;
  ingredients: Ingredient[];
}

const meals: Meal[] = [
  {
    type: "Breakfast",
    name: "Avocado Toast & Egg",
    cals: 320,
    p: 14,
    c: 35,
    f: 16,
    img: "https://images.unsplash.com/photo-1525351484163-9e45e5212259?auto=format&fit=crop&q=80&w=400",
    prepTime: "10 min",
    ingredients: [
      { name: "Sourdough bread", amount: "2 slices (80g)", kcal: 180, protein: 7, carbs: 34, fat: 2 },
      { name: "Avocado", amount: "½ medium (75g)", kcal: 120, protein: 1.5, carbs: 6, fat: 11 },
      { name: "Egg", amount: "1 large (50g)", kcal: 72, protein: 6, carbs: 0.5, fat: 5 },
      { name: "Cherry tomatoes", amount: "60g", kcal: 18, protein: 0.9, carbs: 3.5, fat: 0.2 },
      { name: "Olive oil", amount: "1 tsp (4g)", kcal: 35, protein: 0, carbs: 0, fat: 4 },
      { name: "Red chili flakes", amount: "pinch", kcal: 2, protein: 0.1, carbs: 0.4, fat: 0.1 },
      { name: "Sea salt & pepper", amount: "to taste", kcal: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    type: "Lunch",
    name: "Grilled Chicken Salad",
    cals: 450,
    p: 35,
    c: 20,
    f: 18,
    img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
    prepTime: "15 min",
    ingredients: [
      { name: "Chicken breast (grilled)", amount: "150g", kcal: 248, protein: 31, carbs: 0, fat: 5 },
      { name: "Mixed greens", amount: "100g", kcal: 25, protein: 2, carbs: 4, fat: 0.5 },
      { name: "Cherry tomatoes", amount: "80g", kcal: 24, protein: 1, carbs: 5, fat: 0.3 },
      { name: "Cucumber", amount: "70g", kcal: 11, protein: 0.5, carbs: 2, fat: 0.1 },
      { name: "Feta cheese", amount: "30g", kcal: 80, protein: 4, carbs: 1, fat: 6 },
      { name: "Olive oil dressing", amount: "1 tbsp", kcal: 60, protein: 0, carbs: 0, fat: 7 },
      { name: "Lemon juice", amount: "1 tsp", kcal: 4, protein: 0, carbs: 1, fat: 0 },
    ],
  },
  {
    type: "Dinner",
    name: "Salmon with Quinoa",
    cals: 520,
    p: 40,
    c: 45,
    f: 22,
    img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400",
    prepTime: "25 min",
    ingredients: [
      { name: "Atlantic salmon fillet", amount: "180g", kcal: 300, protein: 34, carbs: 0, fat: 18 },
      { name: "Quinoa (cooked)", amount: "120g", kcal: 144, protein: 5, carbs: 25, fat: 2 },
      { name: "Asparagus", amount: "80g", kcal: 20, protein: 2, carbs: 4, fat: 0.2 },
      { name: "Lemon zest & juice", amount: "½ lemon", kcal: 8, protein: 0.2, carbs: 2.5, fat: 0.1 },
      { name: "Garlic", amount: "2 cloves", kcal: 9, protein: 0.4, carbs: 2, fat: 0 },
      { name: "Olive oil", amount: "1 tsp", kcal: 40, protein: 0, carbs: 0, fat: 4.5 },
      { name: "Dill & capers", amount: "garnish", kcal: 5, protein: 0.3, carbs: 0.5, fat: 0.2 },
    ],
  },
];

function MacroBar({ label, grams, pct, color }: { label: string; grams: number; pct: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="text-[10px] text-white/50 mb-1">{label}</div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs font-medium mt-1">{grams}g</div>
    </div>
  );
}

function IngredientModal({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const totalKcal = meal.ingredients.reduce((s, i) => s + i.kcal, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 flex flex-col max-h-[88vh] rounded-t-[28px] overflow-hidden"
        style={{ background: "rgba(14,14,28,0.97)", border: "1px solid rgba(255,255,255,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="h-[160px] w-full relative shrink-0">
          <img src={meal.img} alt={meal.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1c] via-transparent to-black/20" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-3 left-4">
            <div className="text-[10px] font-bold text-[#8F5CFF] uppercase tracking-wider mb-0.5">{meal.type}</div>
            <h2 className="text-lg font-bold text-white">{meal.name}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col gap-5">
          {/* Macro summary */}
          <GlassCard className="!p-4 bg-gradient-to-r from-[#4F8CFF]/10 to-[#8F5CFF]/10 border-[#8F5CFF]/30">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-orange-400" />
              <span className="text-sm font-semibold">{totalKcal} kcal total</span>
              <span className="ml-auto text-xs text-white/40">{meal.prepTime} prep</span>
            </div>
            <div className="flex gap-4">
              <MacroBar label="Protein" grams={meal.p} pct={Math.round((meal.p * 4 / totalKcal) * 100)} color="bg-blue-400" />
              <MacroBar label="Carbs" grams={meal.c} pct={Math.round((meal.c * 4 / totalKcal) * 100)} color="bg-purple-400" />
              <MacroBar label="Fat" grams={meal.f} pct={Math.round((meal.f * 9 / totalKcal) * 100)} color="bg-orange-400" />
            </div>
          </GlassCard>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80">Ingredients</h3>
              <span className="text-xs text-white/40">{meal.ingredients.length} items</span>
            </div>
            <div className="flex flex-col gap-2">
              {meal.ingredients.map((ing, i) => (
                <motion.div
                  key={ing.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 py-3 px-4 rounded-[14px] bg-white/[0.06] border border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white leading-tight">{ing.name}</div>
                    <div className="text-xs text-white/45 mt-0.5">{ing.amount}</div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <div className={`text-sm font-bold ${ing.kcal > 0 ? "text-white" : "text-white/30"}`}>
                      {ing.kcal > 0 ? `${ing.kcal} kcal` : "—"}
                    </div>
                    {ing.kcal > 0 && (
                      <div className="text-[10px] text-white/40 mt-0.5">
                        P{ing.protein}·C{ing.carbs}·F{ing.fat}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Kcal breakdown bar */}
          <GlassCard className="!p-4">
            <div className="text-xs text-white/60 mb-3 font-medium">Calorie Breakdown</div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {meal.ingredients.filter(i => i.kcal > 0).map((ing) => (
                <div
                  key={ing.name}
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${(ing.kcal / totalKcal) * 100}%`,
                    background: `hsl(${(meal.ingredients.indexOf(ing) * 47) % 360}, 70%, 65%)`,
                  }}
                  title={`${ing.name}: ${ing.kcal} kcal`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
              {meal.ingredients.filter(i => i.kcal > 0).map((ing, idx) => (
                <div key={ing.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ background: `hsl(${idx * 47 % 360}, 70%, 65%)` }}
                  />
                  <span className="text-[10px] text-white/55">{ing.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MealPlan() {
  const [tab, setTab] = useState("Today");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
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
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[60%]" />
                </div>
                <div className="text-xs font-medium mt-1">89g</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/60 mb-1">Carbs</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 w-[45%]" />
                </div>
                <div className="text-xs font-medium mt-1">100g</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/60 mb-1">Fat</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 w-[55%]" />
                </div>
                <div className="text-xs font-medium mt-1">56g</div>
              </div>
            </div>
          </GlassCard>

          {meals.map((meal, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <button
                className="w-full text-left"
                onClick={() => setSelectedMeal(meal)}
              >
                <GlassCard className="!p-4 flex flex-col gap-4 hover:bg-white/[0.13] transition-colors active:scale-[0.99]">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-[16px] overflow-hidden shrink-0 bg-white/5">
                      <img src={meal.img} alt={meal.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-[#8F5CFF] uppercase tracking-wider mb-1">{meal.type}</div>
                      <h3 className="font-bold text-[15px] mb-1 leading-tight">{meal.name}</h3>
                      <div className="text-sm text-white/60">{meal.cals} kcal</div>
                    </div>
                    <div className="text-white/30 self-center">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-3">
                    <div className="text-xs text-white/50 flex gap-3">
                      <span>P: {meal.p}g</span>
                      <span>C: {meal.c}g</span>
                      <span>F: {meal.f}g</span>
                    </div>
                    <div className="text-xs font-medium flex items-center gap-1.5 text-white/50">
                      <UtensilsCrossed size={12} /> {meal.prepTime}
                    </div>
                  </div>
                </GlassCard>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ingredient detail modal */}
      <AnimatePresence>
        {selectedMeal && (
          <IngredientModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
