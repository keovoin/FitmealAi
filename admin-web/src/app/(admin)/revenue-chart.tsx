"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MrrDataPoint } from "@/lib/supabase/admin-queries";

export function RevenueChart({ data }: { data: MrrDataPoint[] }) {
  if (!data.length) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-white/55">
        No subscription data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38D399" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#38D399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={50}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "rgba(255,255,255,0.7)" }}
          formatter={(value: number, name: string) => [
            name === "mrr" ? `$${value.toFixed(2)}` : value,
            name === "mrr" ? "MRR" : "Active subs",
          ]}
        />
        <Area
          type="monotone"
          dataKey="mrr"
          stroke="#38D399"
          strokeWidth={2.5}
          fill="url(#mrrGradient)"
          dot={{ fill: "#38D399", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: "#38D399" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
