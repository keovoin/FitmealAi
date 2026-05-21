import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";
import { Check, X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

export function Paywall() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("gold");

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full gap-6 overflow-y-auto no-scrollbar relative z-50 bg-[#0F172A]"
    >
      <div className="absolute top-4 right-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} />
        </button>
      </div>

      <header className="mt-4 text-center">
        <h1 className="text-[32px] font-bold mb-2">Upgrade Your Plan</h1>
        <p className="text-white/70">Get smarter meal and workout planning.</p>
      </header>

      <div className="flex flex-col gap-4 mt-2">
        <GlassCard 
          className={`relative cursor-pointer transition-all duration-300 ${selectedPlan === "silver" ? "border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02]" : "opacity-80"}`}
          onClick={() => setSelectedPlan("silver")}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-lg font-bold text-slate-300">Silver</div>
              <div className="text-white/60 text-sm">Essential tools</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">$2.99<span className="text-sm font-normal text-white/50">/mo</span></div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><Check size={14} className="text-[#34D399]" /> 7-day meal & workout plan</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-[#34D399]" /> 10 AI regenerations/day</li>
          </ul>
        </GlassCard>

        <GlassCard 
          className={`relative cursor-pointer transition-all duration-300 ${selectedPlan === "gold" ? "border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.2)] bg-gradient-to-br from-amber-500/10 to-orange-500/10 scale-[1.02]" : "opacity-80"}`}
          onClick={() => setSelectedPlan("gold")}
        >
          {selectedPlan === "gold" && (
            <motion.div 
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Best Value
            </motion.div>
          )}
          
          <div className="flex justify-between items-center mb-4 mt-2">
            <div>
              <div className="text-xl font-bold text-amber-300 flex items-center gap-1.5"><ShieldCheck size={18} /> Gold</div>
              <div className="text-white/60 text-sm">Unlimited power</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">$4.99<span className="text-sm font-normal text-white/50">/mo</span></div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-white/90 font-medium">
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-400" /> Unlimited AI planning</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-400" /> Advanced progress insights</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-400" /> Meal replacement suggestions</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-amber-400" /> Premium glass themes</li>
          </ul>
        </GlassCard>
      </div>

      <div className="mt-auto pt-6 flex flex-col gap-4">
        <PrimaryButton className={selectedPlan === "gold" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : ""}>
          Continue with StoreKit
        </PrimaryButton>
        
        <button 
          onClick={() => navigate("/payment/aba")}
          className="text-white/50 text-xs font-medium underline underline-offset-4 text-center hover:text-white transition-colors"
        >
          Alternative: Manual ABA Payment
        </button>

        <div className="flex justify-center gap-4 text-[10px] text-white/40 mt-2">
          <button className="hover:text-white transition-colors">Restore Purchase</button>
          <span>·</span>
          <button className="hover:text-white transition-colors">Terms</button>
          <span>·</span>
          <button className="hover:text-white transition-colors">Privacy</button>
        </div>
      </div>
    </motion.div>
  );
}
