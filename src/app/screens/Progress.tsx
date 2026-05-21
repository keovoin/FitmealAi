import { motion } from "motion/react";
import { GlassCard } from "../components/ui";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router";

export function Progress() {
  const navigate = useNavigate();

  const weightData = [
    { day: "Mon", weight: 75 },
    { day: "Tue", weight: 74.8 },
    { day: "Wed", weight: 74.5 },
    { day: "Thu", weight: 74.6 },
    { day: "Fri", weight: 74.2 },
    { day: "Sat", weight: 74.0 },
    { day: "Sun", weight: 73.8 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full gap-6 overflow-y-auto no-scrollbar pb-24"
    >
      <header>
        <h1 className="text-[28px] font-bold mb-1">Progress</h1>
        <p className="text-white/70">Keep up the good work.</p>
      </header>

      <GlassCard className="!p-5">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-sm font-medium text-white/70 mb-1">Current Weight</h3>
            <div className="text-2xl font-bold">73.8 <span className="text-base font-normal text-white/50">kg</span></div>
          </div>
          <div className="text-[#34D399] font-medium text-sm flex items-center bg-[#34D399]/10 px-2 py-1 rounded-lg">
            ↓ 1.2 kg
          </div>
        </div>
        
        <div className="h-[180px] w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'white' }}
                itemStyle={{ color: '#8F5CFF' }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#8F5CFF" 
                strokeWidth={3} 
                dot={{ fill: '#4F8CFF', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="!p-4">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 text-blue-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div className="text-xs text-white/70 font-medium mb-1">Consistency</div>
          <div className="text-xl font-bold">85%</div>
        </GlassCard>
        
        <GlassCard className="!p-4">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3 text-orange-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19c-1.5 0-2.5-1-2.5-2.5a2.5 2.5 0 1 0-5 0c0 1.5-1 2.5-2.5 2.5C4 19 2 17.5 2 15c0-3.5 4.5-9.5 10-13 5.5 3.5 10 9.5 10 13 0 2.5-2 4-5.5 4z"/></svg>
          </div>
          <div className="text-xs text-white/70 font-medium mb-1">Avg Calories</div>
          <div className="text-xl font-bold">1,740</div>
        </GlassCard>
      </div>

      <GlassCard className="!p-5 bg-gradient-to-r from-amber-500/5 to-amber-500/10 border-amber-500/20 relative overflow-hidden group cursor-pointer" onClick={() => navigate("/paywall")}>
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Lock size={48} />
        </div>
        <div className="relative z-10 w-[80%]">
          <div className="text-amber-400 font-bold text-sm mb-1 uppercase tracking-wider">Gold Feature</div>
          <h3 className="font-semibold text-lg mb-2 text-white">Advanced Insights</h3>
          <p className="text-sm text-white/60 leading-relaxed mb-4">Unlock macro trends, muscle group heatmaps, and AI-driven adjustments.</p>
          <div className="inline-flex items-center text-amber-300 text-sm font-medium">
            Upgrade Now <span className="ml-1">→</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
