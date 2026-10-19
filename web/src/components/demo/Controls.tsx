"use client";

import type { RiderState } from "@/lib/schema";

export function Controls({
  rider,
  act,
  hasActive,
}: {
  rider: RiderState | null;
  act: (action: string, value?: unknown) => Promise<void>;
  hasActive: boolean;
}) {
  const btn = "rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center gap-2">
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
        Rider taps I&apos;m OK
      </button>
      <span className="mx-1 hidden h-5 w-px bg-white/20 sm:block" />
      <button
        onClick={() => act("rain", !rider?.rain)}
        className={`${btn} border ${rider?.rain ? "border-violet bg-violet/30" : "border-white/30"}`}
        aria-pressed={!!rider?.rain}
      >
        Rain {rider?.rain ? "on" : "off"}
      </button>
      <div className="flex overflow-hidden rounded-full border border-white/30">
        {(["green", "amber", "red"] as const).map((h) => (
          <button
            key={h}
            onClick={() => act("heat", h)}
            className={`px-3 py-2 text-sm capitalize transition ${
              rider?.heat === h ? (h === "red" ? "bg-peach text-ink" : h === "amber" ? "bg-lemon text-ink" : "bg-paper text-ink") : "hover:bg-white/10"
            }`}
            aria-pressed={rider?.heat === h}
          >
            {h}
          </button>
        ))}
      </div>
      <div className="flex overflow-hidden rounded-full border border-white/30">
        {(["Platform A", "Platform B"] as const).map((p) => (
          <button
            key={p}
            onClick={() => act("platform", p)}
            className={`px-3 py-2 text-sm transition ${rider?.platform === p ? "bg-paper text-ink" : "hover:bg-white/10"}`}
            aria-pressed={rider?.platform === p}
          >
            {p}
          </button>
        ))}
      </div>
      <button onClick={() => act("reset")} className={`${btn} border border-white/30 opacity-70 hover:opacity-100`}>
        Reset
      </button>
    </div>
  );
}
