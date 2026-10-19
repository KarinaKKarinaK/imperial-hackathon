"use client";

import { motion } from "motion/react";

type CI = { value: number; lo: number; hi: number };

// Horizontal bars with confidence whiskers, two metrics per row.
export function BarChart({
  rows,
  metrics,
  highlight,
}: {
  rows: { key: string; label: string; values: Record<string, CI> }[];
  metrics: { key: string; label: string; gradient: string }[];
  highlight?: string;
}) {
  const labelW = 150;
  const rowH = 20;
  const gap = 4;
  const groupGap = 14;
  const W = 700;
  const rightW = 124;
  const plotW = W - labelW - rightW;
  const H = rows.length * (metrics.length * (rowH + gap) + groupGap) + 24;
  const x = (v: number) => labelW + Math.max(0, Math.min(1, v)) * plotW;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px]" role="img" aria-label="Precision and recall by model">
        <defs>
          {metrics.map((m) => (
            <linearGradient key={m.key} id={`g-${m.key}`} x1="0" x2="1">
              {m.gradient === "violet" ? (
                <>
                  <stop offset="0" stopColor="#8f7bff" />
                  <stop offset="1" stopColor="#6b4cff" />
                </>
              ) : (
                <>
                  <stop offset="0" stopColor="#f5c9a8" />
                  <stop offset="1" stopColor="#f0a070" />
                </>
              )}
            </linearGradient>
          ))}
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={8} y2={H - 16} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="2 4" />
            <text x={x(t)} y={H - 2} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.5">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        {rows.map((r, ri) => {
          const y0 = 12 + ri * (metrics.length * (rowH + gap) + groupGap);
          const strong = r.key === highlight;
          return (
            <g key={r.key}>
              <text x={0} y={y0 + rowH + 2} fontSize="13" fontWeight={strong ? 600 : 400} fill="currentColor">
                {r.label}
              </text>
              {metrics.map((m, mi) => {
                const c = r.values[m.key];
                const y = y0 + mi * (rowH + gap);
                return (
                  <g key={m.key} opacity={strong ? 1 : 0.78}>
                    <rect x={labelW} y={y} width={plotW} height={rowH} rx={rowH / 2} fill="currentColor" fillOpacity="0.06" />
                    <motion.rect
                      x={labelW}
                      y={y}
                      height={rowH}
                      rx={rowH / 2}
                      fill={`url(#g-${m.key})`}
                      initial={{ width: 0 }}
                      whileInView={{ width: x(c.value) - labelW }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.05 * (ri * metrics.length + mi), ease: [0.16, 1, 0.3, 1] }}
                    />
                    <line x1={x(c.lo)} x2={x(c.hi)} y1={y + rowH / 2} y2={y + rowH / 2} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
                    <line x1={x(c.lo)} x2={x(c.lo)} y1={y + 5} y2={y + rowH - 5} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
                    <line x1={x(c.hi)} x2={x(c.hi)} y1={y + 5} y2={y + rowH - 5} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
                    <text x={labelW + plotW + 12} y={y + rowH - 5} fontSize="12" fontFamily="var(--font-mono)" fill="currentColor">
                      {Math.round(c.value * 100)}%
                    </text>
                    <text x={W - 4} y={y + rowH - 5} fontSize="10" textAnchor="end" fill="currentColor" fillOpacity="0.5">
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// A dot plot on a zoomed axis, for metrics that all sit near 1.
export function DotPlot({ rows, min = 0.94, max = 1, highlight }: { rows: { key: string; label: string; ci: CI }[]; min?: number; max?: number; highlight?: string }) {
  const labelW = 140;
  const W = 560;
  const rowH = 34;
  const plotW = W - labelW - 80;
  const H = rows.length * rowH + 30;
  const x = (v: number) => labelW + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * plotW;
  const ticks = [min, (min + max) / 2, max];
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[440px]" role="img" aria-label="AUROC by model">
        <defs>
          <radialGradient id="dot-g">
            <stop offset="0" stopColor="#f3f3f0" />
            <stop offset="1" stopColor="#8f7bff" />
          </radialGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={8} y2={H - 20} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="2 4" />
            <text x={x(t)} y={H - 4} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.5">
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = 22 + i * rowH;
          const strong = r.key === highlight;
          return (
            <g key={r.key} opacity={strong ? 1 : 0.75}>
              <text x={0} y={y + 4} fontSize="13" fontWeight={strong ? 600 : 400} fill="currentColor">
                {r.label}
              </text>
              <line x1={x(r.ci.lo)} x2={x(r.ci.hi)} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
              <motion.circle
                cx={x(r.ci.value)}
                cy={y}
                r={strong ? 8 : 6}
                fill="url(#dot-g)"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i, type: "spring" }}
              />
              <text x={W - 2} y={y + 4} textAnchor="end" fontSize="12" fontFamily="var(--font-mono)" fill="currentColor">
                {r.ci.value.toFixed(3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Heatmap: rows are models, columns are scenarios, cell colour is the share
// flagged as a crash. Good cells are dark, wrong cells glow.
export function Heatmap({
  rows,
  cols,
  colLabels,
  highlight,
}: {
  rows: { key: string; label: string; values: Record<string, number> }[];
  cols: string[];
  colLabels: Record<string, string>;
  highlight?: string;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid" style={{ gridTemplateColumns: `150px repeat(${cols.length}, 1fr)` }}>
          <div />
          {cols.map((c) => (
            <div key={c} className="pb-2 text-center text-[11px] uppercase tracking-wider opacity-60">
              {colLabels[c]}
            </div>
          ))}
          {rows.map((r, ri) => (
            <RowCells key={r.key} r={r} ri={ri} cols={cols} strong={r.key === highlight} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RowCells({ r, ri, cols, strong }: { r: { key: string; label: string; values: Record<string, number> }; ri: number; cols: string[]; strong: boolean }) {
  return (
    <>
      <div className={`flex items-center py-1 pr-3 text-[13px] ${strong ? "font-semibold" : "opacity-80"}`}>{r.label}</div>
      {cols.map((c, ci) => {
        const v = r.values[c] ?? 0;
        const wantHigh = c === "crash";
        const wrong = wantHigh ? 1 - v : v; // 0 good, 1 bad
        const bg = wantHigh
          ? `linear-gradient(135deg, rgba(143,123,255,${0.25 + 0.75 * v}) 0%, rgba(107,76,255,${0.25 + 0.75 * v}) 100%)`
          : `linear-gradient(135deg, rgba(240,160,112,${0.1 + 0.9 * wrong}) 0%, rgba(240,160,112,${0.05 + 0.9 * wrong}) 100%)`;
        return (
          <motion.div
            key={c}
            className="m-[3px] flex h-11 items-center justify-center rounded-xl text-sm font-medium"
            style={{ background: v === 0 && !wantHigh ? "rgba(255,255,255,0.05)" : bg, color: wrong > 0.5 || (wantHigh && v > 0.5) ? "#0a0a0a" : "inherit" }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.03 * (ri * cols.length + ci) }}
            title={`${r.label}, ${c}: ${(v * 100).toFixed(0)}% flagged`}
          >
            {(v * 100).toFixed(0)}%
          </motion.div>
        );
      })}
    </>
  );
}
