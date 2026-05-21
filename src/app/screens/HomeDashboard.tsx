import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton, MetricRing } from "../components/ui";
import { ChevronRight, Droplets, Footprints, Moon, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export function HomeDashboard() {
  const navigate = useNavigate();
  const today = new Date();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
      className="flex-1 flex flex-col p-6 pt-12 pb-24 h-full gap-6 overflow-y-auto no-scrollbar"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-bold">Good Morning, Chyvoin</h1>
          <p className="text-[14px] text-white/70 mt-1">{format(today, "EEEE, MMMM do")} · Let's crush it</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/20 p-1 flex items-center justify-center overflow-hidden shrink-0">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="Profile" className="w-full h-full rounded-full object-cover" />
        </div>
      </header>

      <GlassCard className="flex items-center justify-between !p-5">
        <div>
          <h2 className="text-sm text-white/70 font-medium mb-1">Daily Summary</h2>
          <div className="text-2xl font-bold">1,850 <span className="text-sm font-normal text-white/60">kcal target</span></div>
        </div>
        <MetricRing value={1200} max={1850} size={72} strokeWidth={8} label="65%" />
      </GlassCard>

      <div className="flex gap-4">
        <GlassCard className="flex-1 !p-4 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform" onClick={() => navigate("/meals")}>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>
          </div>
          <span className="font-semibold text-sm">Meals</span>
          <span className="text-xs text-white/60">3 planned</span>
        </GlassCard>
        
        <GlassCard className="flex-1 !p-4 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform" onClick={() => navigate("/workout")}>
          <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 5.5v13M18 5.5v13M3 8h6M3 16h6M15 8h6M15 16h6"/></svg>
          </div>
          <span className="font-semibold text-sm">Workout</span>
          <span className="text-xs text-white/60">30 min Full Body</span>
        </GlassCard>
      </div>

      <GlassCard className="!p-5 relative overflow-hidden group cursor-pointer" onClick={() => navigate("/habits")}>
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h2 className="font-semibold text-lg">Daily Habits</h2>
          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
        </div>
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Droplets size={16} />
            </div>
            <span className="text-sm font-medium flex-1">Drink 2L Water</span>
            <CheckCircle2 size={20} className="text-[#34D399]" />
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center shrink-0">
              <Footprints size={16} />
            </div>
            <span className="text-sm font-medium flex-1">5,000 Steps</span>
            <div className="w-5 h-5 rounded-full border-2 border-white/20" />
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <Moon size={16} />
            </div>
            <span className="text-sm font-medium flex-1">Sleep 8h</span>
            <div className="w-5 h-5 rounded-full border-2 border-white/20" />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="!p-4 border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 flex items-center justify-between" onClick={() => navigate("/paywall")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-300 to-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div>
            <h3 className="font-bold text-amber-100 text-sm">Upgrade to Gold</h3>
            <p className="text-xs text-amber-200/70">Unlock unlimited AI planning</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-200/50" />
      </GlassCard>

      <PrimaryButton onClick={() => navigate("/generating")} className="mt-4 shadow-[0_8px_24px_rgba(79,140,255,0.3)]">
        Regenerate AI Plan
      </PrimaryButton>
      
    </motion.div>
  );
}
