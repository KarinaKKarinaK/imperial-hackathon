"use client";

import type { RiderState } from "@/lib/schema";

const REPLAY: [string, string][] = [
  ["riding", "Riding"],
  ["braking", "Hard brake"],
  ["pothole", "Pothole"],
  ["set_down", "Set down"],
  ["bag_drop", "Bag drop"],
  ["crash", "Crash"],
];

function Group({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.14em] opacity-50">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Controls({
  rider,
  act,
  hasActive,
}: {
  rider: RiderState | null;
  act: (action: string, value?: unknown) => Promise<void>;
  hasActive: boolean;
}) {
  const btn = "rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-40";
  const seg = "flex overflow-hidden rounded-full border border-white/30";
  const segBtn = "px-3 py-2 text-sm transition";
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr] lg:gap-6">
      <Group label="Shift">
        {!rider?.onShift ? (
          <button onClick={() => act("start")} className={`${btn} bg-paper text-ink hover:bg-violet hover:text-white`}>
            Start shift
          </button>
        ) : (
          <button onClick={() => act("crash")} disabled={hasActive} className={`${btn} bg-peach text-ink hover:brightness-110`}>
            Trigger crash
          </button>
        )}
        <button onClick={() => act("ok")} disabled={!hasActive} className={`${btn} border border-white/40 hover:bg-paper hover:text-ink`}>
          I&apos;m OK
        </button>
        <button onClick={() => act("reset")} className={`${btn} border border-white/20 opacity-70 hover:opacity-100`}>
          Reset
        </button>
      </Group>

      <Group label="Conditions">
        <button
          onClick={() => act("rain", !rider?.rain)}
          className={`${btn} border ${rider?.rain ? "border-violet bg-violet/30" : "border-white/30"}`}
          aria-pressed={!!rider?.rain}
        >
          Rain {rider?.rain ? "on" : "off"}
        </button>
        <div className={seg} role="group" aria-label="Heat band">
          {(["green", "amber", "red"] as const).map((h) => (
            <button
              key={h}
              onClick={() => act("heat", h)}
              className={`${segBtn} capitalize ${
                rider?.heat === h ? (h === "red" ? "bg-peach text-ink" : h === "amber" ? "bg-lemon text-ink" : "bg-paper text-ink") : "hover:bg-white/10"
              }`}
              aria-pressed={rider?.heat === h}
            >
              {h}
            </button>
          ))}
        </div>
        <div className={seg} role="group" aria-label="Platform">
          {(["Platform A", "Platform B"] as const).map((p) => (
            <button
              key={p}
              onClick={() => act("platform", p)}
              className={`${segBtn} ${rider?.platform === p ? "bg-paper text-ink" : "hover:bg-white/10"}`}
              aria-pressed={rider?.platform === p}
            >
              {p.replace("Platform ", "App ")}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Order countdown">
        {[3, 8, 15].map((m) => (
          <button key={m} onClick={() => act("deadline", m)} disabled={!rider?.onShift} className={`${btn} border border-white/30 hover:bg-white/10`}>
            {m} min
          </button>
        ))}
      </Group>

      <Group label="Feed the detector" className="sm:col-span-2 lg:col-span-3 lg:border-t lg:border-white/10 lg:pt-3">
        {REPLAY.map(([k, label]) => (
          <button
            key={k}
            onClick={() => act("replay", k)}
            disabled={!rider?.onShift}
            className={`rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-40 ${
              rider?.lastDetection?.scenario === k ? "border-paper bg-paper text-ink" : "border-white/30 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </Group>
    </div>
  );
}
