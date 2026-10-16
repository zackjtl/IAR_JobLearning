"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export type RadarDatum = { label: string; current: number | null; baseline?: number | null };

export function SkillRadar({ data, height = 300, showBaseline = true }: { data: RadarDatum[]; height?: number; showBaseline?: boolean }) {
  const hasBaseline = showBaseline && data.some((d) => typeof d.baseline === "number");
  const rows = data.map((d) => ({ label: d.label, current: d.current ?? 0, baseline: d.baseline ?? 0, missing: d.current === null }));
  return (
    <div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RadarChart data={rows} outerRadius="72%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fill: "var(--faint)", fontSize: 10 }} tickFormatter={(v) => (v === 0 || v === 100 ? "" : String(v))} axisLine={false} angle={90} />
            {hasBaseline && (
              <Radar name="診斷基準" dataKey="baseline" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
            )}
            <Radar name="目前估計" dataKey="current" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} dot={{ r: 4 }} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--fg)" }}
              formatter={(v, name, item) => {
                const missing = (item?.payload as { missing?: boolean })?.missing;
                return [missing && name === "目前估計" ? "未評估" : `${v}`, name];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex items-center justify-center gap-4 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--chart-1)" }} />目前估計</span>
        {hasBaseline && <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed" style={{ borderColor: "var(--chart-2)" }} />診斷基準</span>}
      </div>
    </div>
  );
}
