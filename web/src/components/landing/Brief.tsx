"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Reveal } from "../Reveal";

const STEPS = [
  ["01", "Evidence", "Ten plus peer-reviewed sources. Burden quantified."],
  ["02", "Build", "Sensor, phone client, detector, record, two dashboards."],
  ["03", "Validate", "Drop tests, controls, confidence intervals."],
  ["04", "Translate", "Sandbox pathway, two-column model, risk register."],
  ["05", "Govern", "Consent, ownership, PDPO, dual use named."],
];

const PILLARS = [
  {
    key: "eng",
    name: "Engineering",
    color: "bg-violet text-white",
    did: ["Framed it as a verification problem, not an insurance one.", "Helmet sensor, phone client, three-signal detector, open schema.", "Drop test rig, precision and recall on our own data.", "Phone-only tier first, helmet tier for crash-grade data."],
  },
  {
    key: "sci",
    name: "Science",
    color: "bg-paper text-ink",
    did: ["Quantified rider counts, compensation rate, claim volumes.", "Sensor placement, sampling rate, calibration.", "Protocol, controls, intervals. What a flat drop does not prove.", "Uncertainty carried into the financial model."],
  },
  {
    key: "med",
    name: "Medicine",
    color: "bg-peach text-ink",
    did: ["Uncompensated injury as a public health gap.", "Triage by mechanism and magnitude. Alerts aimed at the worker.", "Impact thresholds cited to biomechanics. Probable, never diagnosis.", "Worker-protective framing for the heat warning review."],
  },
  {
    key: "bus",
    name: "Business",
    color: "bg-lemon text-ink",
    did: ["Found the apportionment clause nobody can operate without a record.", "Parametric trigger, fixed first tier, hospital second tier.", "Pilot and scale columns, assumptions on the page.", "One insurer, one platform, then cross-border through reinsurers."],
  },
];

const STAGES = ["Problem", "Design", "Validation", "Route to market"];

export function Brief() {
  const [active, setActive] = useState("eng");
  const pillar = PILLARS.find((p) => p.key === active)!;

  return (
    <section id="method" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mb-10 max-w-3xl">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            Four disciplines.
            <br />
            One record.
          </h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-5">
          {STEPS.map(([n, t, b], i) => (
            <Reveal key={n} delay={i * 0.05} className="tile tile-paper p-6">
              <p className="mono text-xs opacity-50">{n}</p>
              <h3 className="mt-3 text-xl font-medium">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{b}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-12">
          <div className="tile tile-night p-6 md:col-span-4 sm:p-8">
            <p className="eyebrow">Who did what</p>
            <div className="mt-5 flex flex-wrap gap-2">
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
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-8">
            {STAGES.map((label, i) => (
              <motion.div
                key={label + active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`tile p-6 ${i === 0 ? pillar.color : "tile-paper"}`}
              >
                <p className="eyebrow">{label}</p>
                <p className="mt-3 text-[15px] leading-relaxed">{pillar.did[i]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
