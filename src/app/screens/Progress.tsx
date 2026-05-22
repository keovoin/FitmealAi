import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard, SegmentedControl } from "../components/ui";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router";

type Period = "Weekly" | "Monthly" | "Quarterly";

const DATA: Record<Period, { label: string; weight: number; calories: number }[]> = {
  Weekly: [
    { label: "Mon", weight: 75.0, calories: 1820 },
    { label: "Tue", weight: 74.8, calories: 1750 },
    { label: "Wed", weight: 74.5, calories: 1900 },
    { label: "Thu", weight: 74.6, calories: 1680 },
    { label: "Fri", weight: 74.2, calories: 1760 },
    { label: "Sat", weight: 74.0, calories: 2100 },
    { label: "Sun", weight: 73.8, calories: 1650 },
  ],
  Monthly: [
    { label: "Wk 1", weight: 75.4, calories: 1800 },
    { label: "Wk 2", weight: 74.9, calories: 1760 },
    { label: "Wk 3", weight: 74.4, calories: 1720 },
    { label: "Wk 4", weight: 73.8, calories: 1740 },
  ],
  Quarterly: [
    { label: "Jan", weight: 77.2, calories: 1950 },
    { label: "Feb", weight: 76.1, calories: 1880 },
    { label: "Mar", weight: 75.0, calories: 1820 },
    { label: "Apr", weight: 74.2, calories: 1760 },
    { label: "May", weight: 73.8, calories: 1740 },
  ],
};

const STATS: Record<Period, { consistency: string; avgCal: string; workouts: string; loss: string; lossLabel: string }> = {
  Weekly: { consistency: "85%", avgCal: "1,780", workouts: "5", loss: "−1.2 kg", lossLabel: "this week" },
  Monthly: { consistency: "79%", avgCal: "1,755", workouts: "18", loss: "−1.6 kg", lossLabel: "this month" },
  Quarterly: { consistency: "81%", avgCal: "1,830", workouts: "58", loss: "−3.4 kg", lossLabel: "this quarter" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs">
        <div className="text-white/60 mb-1">{label}</div>
        <div className="text-white font-bold">{payload[0]?.value} kg</div>
      </div>
    );
  }
  return null;
};

const CalTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs">
        <div className="text-white/60 mb-1">{label}</div>
        <div className="text-white font-bold">{payload[0]?.value} kcal</div>
      </div>
    );
  }
  return null;
};

export function Progress() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("Weekly");

  const data = DATA[period];
  const stats = STATS[period];
  const currentWeight = data[data.length - 1].weight;
  const startWeight = data[0].weight;
  const delta = (currentWeight - startWeight).toFixed(1);

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

      {/* Period selector */}
      <SegmentedControl
        options={["Weekly", "Monthly", "Quarterly"]}
        value={period}
        onChange={(v) => setPeriod(v as Period)}
      />

      {/* Weight chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <GlassCard className="!p-5">
            <div className="flex justify-between items-end mb-5">
              <div>
                <h3 className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Weight</h3>
                <div className="text-2xl font-bold">
                  {currentWeight}{" "}
                  <span className="text-base font-normal text-white/50">kg</span>
                </div>
              </div>
              <div className={`font-medium text-sm flex items-center px-2.5 py-1.5 rounded-xl ${
                Number(delta) <= 0
                  ? "text-[#34D399] bg-[#34D399]/10"
                  : "text-red-400 bg-red-400/10"
              }`}>
                {Number(delta) <= 0 ? "↓" : "↑"} {Math.abs(Number(delta))} kg
              </div>
            </div>

            <div className="h-[160px] w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.25)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#8F5CFF"
                    strokeWidth={3}
                    dot={{ fill: "#4F8CFF", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "white" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Calorie bar chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-cal"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <GlassCard className="!p-5">
            <h3 className="text-xs font-medium text-white/60 mb-4 uppercase tracking-wider">Avg Daily Calories</h3>
            <div className="h-[130px] w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={period === "Quarterly" ? 22 : period === "Monthly" ? 34 : 20}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8CFF" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#8F5CFF" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.25)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis domain={[1400, 2200]} hide />
                  <Tooltip content={<CalTooltip />} />
                  <Bar dataKey="calories" fill="url(#calGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Stats grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-stats"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <GlassCard className="!p-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 text-blue-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="text-xs text-white/60 font-medium mb-1">Consistency</div>
            <div className="text-xl font-bold">{stats.consistency}</div>
          </GlassCard>

          <GlassCard className="!p-4">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3 text-orange-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.5 19c-1.5 0-2.5-1-2.5-2.5a2.5 2.5 0 1 0-5 0c0 1.5-1 2.5-2.5 2.5C4 19 2 17.5 2 15c0-3.5 4.5-9.5 10-13 5.5 3.5 10 9.5 10 13 0 2.5-2 4-5.5 4z" />
              </svg>
            </div>
            <div className="text-xs text-white/60 font-medium mb-1">Avg Calories</div>
            <div className="text-xl font-bold">{stats.avgCal}</div>
          </GlassCard>

          <GlassCard className="!p-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 text-purple-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6.5 6.5a10 10 0 1 0 11 0" /><path d="M12 2v7" />
              </svg>
            </div>
            <div className="text-xs text-white/60 font-medium mb-1">Workouts</div>
            <div className="text-xl font-bold">{stats.workouts}</div>
          </GlassCard>

          <GlassCard className="!p-4">
            <div className="w-8 h-8 rounded-full bg-[#34D399]/20 flex items-center justify-center mb-3 text-[#34D399]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div className="text-xs text-white/60 font-medium mb-1">Weight Lost</div>
            <div className="text-xl font-bold text-[#34D399]">{stats.loss}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{stats.lossLabel}</div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Gold upsell */}
      <GlassCard
        className="!p-5 bg-gradient-to-r from-amber-500/5 to-amber-500/10 border-amber-500/20 relative overflow-hidden cursor-pointer"
        onClick={() => navigate("/paywall")}
      >
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Lock size={48} />
        </div>
        <div className="relative z-10 w-[80%]">
          <div className="text-amber-400 font-bold text-sm mb-1 uppercase tracking-wider">Gold Feature</div>
          <h3 className="font-semibold text-lg mb-2 text-white">Advanced Insights</h3>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            Unlock macro trends, muscle group heatmaps, and AI-driven adjustments.
          </p>
          <div className="inline-flex items-center text-amber-300 text-sm font-medium">
            Upgrade Now <span className="ml-1">→</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
