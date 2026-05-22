import { motion } from "motion/react";
import { GlassCard } from "../components/ui";
import { ChevronRight, User, CreditCard, ShieldCheck, Heart, Dumbbell, LifeBuoy, FileText, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { getWorkoutPrefs, getMealPrefs } from "../store/preferences";

export function Settings() {
  const navigate = useNavigate();
  const workoutPrefs = getWorkoutPrefs();
  const mealPrefs = getMealPrefs();

  const workoutSummary = `${workoutPrefs.types.length} type${workoutPrefs.types.length !== 1 ? "s" : ""} · ${workoutPrefs.days}`;
  const mealSummary = `${mealPrefs.diets.length} diet${mealPrefs.diets.length !== 1 ? "s" : ""} · ${mealPrefs.timings.length} meals`;

  const sections = [
    {
      title: "Account",
      items: [
        { icon: CreditCard, label: "Current Plan: Free", value: "Upgrade", onClick: () => navigate("/paywall"), highlight: true },
        { icon: ShieldCheck, label: "Restore Purchase" },
        { icon: FileText, label: "Payment History" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Heart, label: "Diet Preferences", value: mealSummary, onClick: () => navigate("/settings/meal") },
        { icon: Dumbbell, label: "Workout Settings", value: workoutSummary, onClick: () => navigate("/settings/workout") },
      ]
    },
    {
      title: "Support & Legal",
      items: [
        { icon: LifeBuoy, label: "Contact Support" },
        { icon: FileText, label: "Privacy Policy" },
        { icon: FileText, label: "Terms of Use" },
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full gap-6 overflow-y-auto no-scrollbar pb-24"
    >
      <header>
        <h1 className="text-[28px] font-bold mb-1">Settings</h1>
      </header>

      <GlassCard className="flex items-center gap-4 !p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/20 p-1 flex items-center justify-center overflow-hidden shrink-0">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="Profile" className="w-full h-full rounded-full object-cover" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Demo User</h2>
          <p className="text-sm text-white/60">demo@example.com</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <User size={20} />
        </button>
      </GlassCard>

      <div className="flex flex-col gap-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">{section.title}</h3>
            <GlassCard className="!p-0 overflow-hidden flex flex-col divide-y divide-white/10">
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors active:bg-white/10"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 text-white/70 flex items-center justify-center shrink-0">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-[15px]">{item.label}</div>
                        {item.value && !item.highlight && (
                          <div className="text-xs text-white/40 mt-0.5">{item.value}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      {item.value && item.highlight && <span className="text-amber-400 font-bold">{item.value}</span>}
                      <ChevronRight size={16} />
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          </div>
        ))}
      </div>

      <button className="mt-4 flex items-center justify-center gap-2 text-red-400 font-medium py-4 hover:bg-white/5 rounded-2xl transition-colors">
        <LogOut size={18} /> Sign Out
      </button>

      <div className="text-center text-xs text-white/30 mt-4">
        VitaGlass AI v1.0.0
      </div>
    </motion.div>
  );
}
