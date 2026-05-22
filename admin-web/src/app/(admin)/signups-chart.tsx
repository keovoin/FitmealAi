"use client";

import type { SeriesPoint } from "@/data/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SignupsChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8F5CFF" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#8F5CFF" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="rgba(255,255,255,0.45)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="rgba(255,255,255,0.45)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.15)" }}
          contentStyle={{
            backgroundColor: "rgba(15,23,42,0.92)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            color: "white",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#8F5CFF"
          strokeWidth={2.2}
          fill="url(#signupsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
