"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Reveal } from "../Reveal";

const STEPS = [
  {
    n: "01",
    title: "Evidence base",
    pillars: "All pillars",
    body: "Structured review, ten plus peer-reviewed sources, burden quantified. Rider counts, injury rates, the 13% compensation figure, head impact thresholds.",
    status: "In progress",
  },
  {
    n: "02",
    title: "Design and develop",
    pillars: "Engineering, natural sciences",
    body: "Helmet sensor, phone client, detector, event schema, two dashboards. Documented so another team could rebuild it. Failure modes listed.",
    status: "Live on this site",
  },
  {
    n: "03",
    title: "Validate and stress-test",
    pillars: "Natural sciences, engineering",
    body: "Drop tests at three heights, five drops each, plus non-crash controls. Detection rate with 95% confidence intervals. What it proves and does not.",
    status: "Rig built, data this week",
  },
  {
    n: "04",
    title: "Translation",
    pillars: "Business",
    body: "Insurance Authority sandbox pathway, two-column financial model, stakeholders, risk register with the top three barriers.",
    status: "In progress",
  },
  {
    n: "05",
    title: "Ethics and governance",
    pillars: "All pillars",
    body: "Consent, data ownership, PDPO mapping, dual-use risk named, limits of the evidence stated.",
    status: "Designed into the schema",
  },
];

const PILLARS = [
  {
    key: "eng",
    name: "Engineering",
    color: "bg-violet text-white",
    did: {
      identify: "Found that no data standard exists for a work-time incident. Framed it as a verification problem, not an insurance one.",
      design: "Helmet sensor, phone client, three-signal detector, event schema, API, dispatcher and underwriter pages.",
      validate: "Drop test rig and firmware. Precision and recall against our own data and a public fall-detection set.",
      translate: "Phone-only tier first, helmet tier for platforms that want crash-grade data. Open schema any insurer can read.",
    },
  },
  {
    key: "sci",
    name: "Natural sciences",
    color: "bg-paper text-ink",
    did: {
      identify: "Quantified the burden: rider counts, compensation rate, claim volumes, heat exposure days.",
      design: "Sensor placement and sampling rate. Calibration against known impacts.",
      validate: "Test protocol, controls, confidence intervals, sensitivity of thresholds. States what a flat drop does and does not prove.",
      translate: "Uncertainty ranges carried into the financial model instead of point estimates.",
    },
  },
  {
    key: "med",
    name: "Medicine and health",
    color: "bg-peach text-ink",
    did: {
      identify: "Occupational trauma in self-employed riders as a public health gap. The 13% figure as untreated and uncompensated injury.",
      design: "Triage profile by mechanism and magnitude. Heat and fatigue alerts aimed at the worker.",
      validate: "Head impact thresholds cited to biomechanics literature. Probable, never diagnosis.",
      translate: "Worker-protective framing for the Labour Department's heat warning review. Mental health lens on the fatigue signal.",
    },
  },
  {
    key: "bus",
    name: "Business",
    color: "bg-lemon text-ink",
    did: {
      identify: "Read the July 2026 proposal and found the apportionment clause nobody can operate without a record.",
      design: "Parametric trigger, fixed first tier, hospital second tier. Who pays and who never does.",
      validate: "Two-column model: Hong Kong pilot and one large platform. Assumptions on the page.",
      translate: "Sandbox pilot with one insurer and one platform, then cross-border through reinsurers. Risk register.",
    },
  },
];

const STAGES = [
  ["identify", "Problem"],
  ["design", "Design"],
  ["validate", "Validation"],
  ["translate", "Translation"],
] as const;

export function Brief() {
  const [active, setActive] = useState<string>("eng");
  const pillar = PILLARS.find((p) => p.key === active)!;

  return (
    <section id="brief" className="px-4 pt-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
              Built for the brief.
              <br />
              All five steps. All four pillars.
            </h2>
          </Reveal>
          <p className="max-w-md text-[15px] opacity-70">
            The open challenge asks for a research-grade response in five steps and a STEMB map that shows what each discipline actually
            did. Both are here.
          </p>
        </div>

        {/* Five steps */}
        <div className="grid gap-3 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05} className="tile tile-paper flex flex-col justify-between p-6">
              <div>
                <p className="mono text-xs opacity-50">{s.n}</p>
                <h3 className="mt-3 text-xl font-medium">{s.title}</h3>
                <p className="mt-1 text-xs opacity-60">{s.pillars}</p>
                <p className="mt-4 text-sm leading-relaxed opacity-80">{s.body}</p>
              </div>
              <span className="pill pill-ink mt-6 self-start">{s.status}</span>
            </Reveal>
          ))}
        </div>

        {/* STEMB map */}
        <div className="mt-3 grid gap-3 md:grid-cols-12">
          <div className="tile tile-ink p-6 md:col-span-4 sm:p-8">
            <p className="eyebrow">STEMB integration map</p>
            <p className="mt-4 text-[15px] leading-relaxed opacity-80">
              Tap a pillar to see what it contributed at each stage. Fifty words of narrative sit on the poster. This is the long version.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {PILLARS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActive(p.key)}
                  className={`pill transition ${active === p.key ? p.color : "pill-outline opacity-70 hover:opacity-100"}`}
                  aria-pressed={active === p.key}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-2" aria-hidden="true">
              {PILLARS.map((p) => (
                <motion.div
                  key={p.key}
                  className={`h-16 rounded-2xl ${p.color}`}
                  animate={{ opacity: active === p.key ? 1 : 0.25, scale: active === p.key ? 1 : 0.96 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:col-span-8">
            {STAGES.map(([k, label], i) => (
              <motion.div
                key={k + active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`tile p-6 ${i === 0 ? pillar.color : "tile-paper"}`}
              >
                <p className="eyebrow">{label}</p>
                <p className="mt-3 text-[15px] leading-relaxed">{pillar.did[k]}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Innovation strip */}
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {[
            ["Apportionment as a field", "The record names the platform active at impact. The July 2026 clause becomes operable."],
            ["Parametric, not adjusted", "A verified event is the trigger. No claim form, no investigation, payout inside a day."],
            ["Rider-owned telemetry", "Raw data stays on the device. Everyone else reads events. Surveillance is designed out, not promised away."],
            ["Coin-sized, no new habit", "Clips to the helmet they already wear. Pairs with the phone they already carry."],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.05} className={`tile p-6 ${i === 0 ? "tile-violet tile-grain" : "tile-ink"}`}>
              <p className="eyebrow">Innovation</p>
              <h3 className="mt-3 text-xl font-medium">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-80">{b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
