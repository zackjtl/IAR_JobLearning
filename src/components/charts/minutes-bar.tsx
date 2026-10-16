"use client";

import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MinutesBar({ data, goal }: { data: { day: string; minutes: number }[]; goal: number }) {
  const rows = data.map((d) => ({ ...d, label: d.day.slice(5).replace("-", "/") }));
  return (
    <div style={{ width: "100%", height: 150 }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barCategoryGap={3}>
          <XAxis dataKey="label" tick={{ fill: "var(--faint)", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
          <YAxis tick={{ fill: "var(--faint)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <ReferenceLine y={goal} stroke="var(--faint)" strokeDasharray="3 3" label={{ value: `目標 ${goal}`, position: "insideTopRight", fill: "var(--faint)", fontSize: 10 }} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--fg)" }}
            formatter={(v) => [`${v} 分鐘`, "學習時間"]}
            labelFormatter={(l) => `${l}`}
          />
          <Bar dataKey="minutes" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
