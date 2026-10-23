"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const STEPS = [
  {
    key: "impact",
    label: "Impact",
    time: "t + 0.0 s",
    title: "The helmet hits the road.",
    body: "The phone sees it. On a helmet, the clip sees it too: acceleration above 6 g.",
    stat: "6 g",
    statLabel: "impact trigger",
    tone: "paper",
  },
  {
    key: "detect",
    label: "Detect",
    time: "t + 0.8 s",
    title: "Impact. Fall. Stillness.",
    body: "Orientation swings, motion stops. Three signals in sequence. A dropped bag rarely shows all three, and the rider can cancel.",
    stat: "0.97",
    statLabel: "detector confidence",
    tone: "violet",
  },
  {
    key: "window",
    label: "30 s",
    time: "t + 30 s",
    title: "Thirty seconds to say I'm fine.",
    body: "One tap cancels everything and nothing leaves the phone. Silence means help is needed.",
    stat: "1 tap",
    statLabel: "cancels the event",
    tone: "ink",
  },
  {
    key: "triage",
    label: "Triage",
    time: "t + 31 s",
    title: "Where, and how hard.",
    body: "Dispatch sees location, mechanism and a probable trauma profile. Probable, never a diagnosis.",
    stat: "Probable blunt trauma",
    statLabel: "high-speed deceleration",
    tone: "paper",
  },
  {
    key: "record",
    label: "Record",
    time: "t + 31 s",
    title: "Which app. Which order. Which second.",
    body: "Signed. Names the app and the order active at impact, and the seconds left on the delivery clock. Shared liability becomes a lookup.",
    stat: "Platform A, ORD-4471",
    statLabel: "14:32:07 HKT",
    tone: "peach",
  },
  {
    key: "payout",
    label: "Payout",
    time: "t + 1 day",
    title: "No form. No adjuster. Paid.",
    body: "A verified event is the trigger. A fixed amount reaches the rider inside a day.",
    stat: "HK$5,450",
    statLabel: "fixed first-tier payout, target",
    tone: "dusk",
  },
] as const;

const toneClass: Record<string, string> = {
  paper: "tile-paper",
  violet: "tile-dusk tile-grain",
  dusk: "tile-dusk tile-grain",
  ink: "tile-night",
  peach: "tile-peach tile-grain",
};

export function Pipeline() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((x) => (x + 1) % STEPS.length), 3600);
    return () => clearInterval(id);
  }, [paused]);

  const step = STEPS[i];

  return (
    <section id="system" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            From impact to payout
            <br />
            in one record.
          </h2>
          <p className="max-w-sm text-[15px] opacity-70">Tap a stage. Everything before the record stays with the rider.</p>
        </div>

        <div
          className="grid gap-4 md:grid-cols-[1fr_1.6fr] md:items-stretch"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Steps rail */}
          <ol className="tile tile-night flex h-full flex-col justify-between p-3">
            {STEPS.map((s, idx) => {
              const active = idx === i;
              return (
                <li key={s.key}>
                  <button
                    onClick={() => setI(idx)}
                    onFocus={() => setI(idx)}
                    className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition ${
                      active ? "bg-paper text-ink" : "hover:bg-white/5"
                    }`}
                    aria-current={active}
                  >
                    <span className="flex items-center gap-4">
                      <span className={`mono text-xs ${active ? "opacity-60" : "opacity-40"}`}>0{idx + 1}</span>
                      <span className="text-lg font-medium">{s.label}</span>
                    </span>
                    <span className={`mono text-xs ${active ? "opacity-60" : "opacity-40"}`}>{s.time}</span>
                  </button>
                  {active && (
                    <motion.div
                      key={s.key + "-bar"}
                      className="mx-4 mt-1 h-[2px] origin-left bg-violet"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: paused ? 0 : 1 }}
                      transition={{ duration: paused ? 0 : 3.6, ease: "linear" }}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* Detail tile */}
          <div className="grid h-full min-h-[360px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 14, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`tile ${toneClass[step.tone]} tile-flow flex h-full flex-col justify-between p-7 [grid-area:1/1] sm:p-10`}
              >
                <div>
                  <p className="eyebrow">{step.time}</p>
                  <h3 className="display mt-4 text-3xl sm:text-4xl lg:text-5xl">{step.title}</h3>
                  <p className="mt-6 max-w-lg text-[15px] leading-relaxed opacity-85 sm:text-base">{step.body}</p>
                </div>
                <div className="mt-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="num text-4xl sm:text-5xl">{step.stat}</p>
                    <p className="mt-2 text-sm opacity-70">{step.statLabel}</p>
                  </div>
                  <StageGlyph k={step.key} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function StageGlyph({ k }: { k: string }) {
  const common = "h-16 w-16 sm:h-20 sm:w-20";
  switch (k) {
    case "impact":
      return (
        <svg viewBox="0 0 80 80" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 60 L30 60 L38 20 L46 70 L54 48 L72 48" />
        </svg>
      );
    case "detect":
      return (
        <svg viewBox="0 0 80 80" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="40" cy="40" r="30" strokeDasharray="4 6" />
          <circle cx="40" cy="40" r="4" fill="currentColor" />
          <path d="M40 10 V40 L62 52" />
        </svg>
      );
    case "window":
      return (
        <svg viewBox="0 0 80 80" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="40" cy="40" r="30" />
          <motion.circle
            cx="40"
            cy="40"
            r="30"
            strokeWidth="4"
            strokeDasharray="188"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 188 }}
            transition={{ duration: 3.4, ease: "linear", repeat: Infinity }}
            transform="rotate(-90 40 40)"
          />
        </svg>
      );
    case "triage":
      return (
        <svg viewBox="0 0 80 80" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M40 72 C40 72 14 50 14 32 A26 26 0 0 1 66 32 C66 50 40 72 40 72 Z" />
          <path d="M30 32 H50 M40 22 V42" />
        </svg>
      );
    case "record":
      return (
        <svg viewBox="0 0 80 80" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="14" y="12" width="52" height="56" rx="6" />
          <path d="M24 28 H56 M24 40 H56 M24 52 H44" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 80 80" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="40" cy="40" r="30" />
          <path d="M26 41 L36 51 L56 30" />
        </svg>
      );
  }
}
