import Link from "next/link";
import { Arrow } from "../Arrow";
import { Counter } from "../Counter";
import { Reveal } from "../Reveal";
import { RecordTile } from "./RecordTile";

export function Problem() {
  return (
    <section id="problem" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-12">
        <Reveal className="tile tile-dusk tile-flow tile-grain flex min-h-[420px] flex-col justify-between p-8 sm:p-12 md:col-span-7 md:min-h-[560px]">
          <span className="pill pill-paper self-start">Today</span>
          <h2 className="display text-5xl sm:text-6xl lg:text-7xl">
            No record.
            <br />
            No proof.
            <br />
            No price.
          </h2>
        </Reveal>
        <div className="grid gap-4 md:col-span-5">
          <Reveal delay={0.08} className="tile tile-paper tile-lift p-7">
            <div className="plus" />
            <h3 className="mt-6 text-2xl font-medium">No employer</h3>
            <p className="mt-3 text-[15px] leading-relaxed opacity-75">
              Riders are contractors. No sick pay, no cover, no compensation. One in three works for two apps at once.
            </p>
          </Reveal>
          <Reveal delay={0.14} className="tile tile-paper tile-lift p-7">
            <div className="plus" />
            <h3 className="mt-6 text-2xl font-medium">No evidence</h3>
            <p className="mt-3 text-[15px] leading-relaxed opacity-75">
              Nothing records the crash. Platforms cannot verify it. Insurers cannot price it. One typhoon case took five years.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="tile tile-night tile-lift p-7">
            <div className="plus" />
            <h3 className="mt-6 text-2xl font-medium">The law is changing</h3>
            <p className="mt-3 text-[15px] leading-relaxed opacity-80">
              Hong Kong is making platforms liable, and splitting liability when a rider is on several apps. Nobody can settle that
              split without a record of which job was active at impact.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const APPLICATIONS = [
  { title: "Delivery riders", tag: "Now", tone: "tile-dusk tile-flow tile-grain", body: "Crash record, triage, payout, apportionment between apps." },
  { title: "Construction", tag: "Next", tone: "tile-paper", body: "667,603 workers. Helmets already on. Same clip, same record." },
  { title: "Outdoor crews", tag: "Next", tone: "tile-paper", body: "Cleaning, security, porters. A per-worker heat record the city-wide warning lacks." },
  { title: "Drivers", tag: "Later", tone: "tile-night", body: "Ride-hailing and vans. The vehicle hosts the sensor, the schema stays the same." },
  { title: "Hospital porters", tag: "Later", tone: "tile-night", body: "Falls and lifting injuries with no witness." },
  { title: "Beyond Hong Kong", tag: "Scale", tone: "tile-ember tile-flow tile-grain", body: "84 million workers in the mainland scheme. Singapore mandatory since 2025. No verification layer in either." },
];

export function Applications() {
  return (
    <section id="applications" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mb-10 max-w-3xl">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            One record.
            <br />
            Every body at work.
          </h2>
          <p className="mt-5 max-w-md text-[15px] opacity-70">Riders first, because the law names them. The record does not care what the worker stands on.</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPLICATIONS.map((a, i) => (
            <Reveal key={a.title} delay={(i % 3) * 0.07} className={`tile tile-lift ${a.tone} flex min-h-[240px] flex-col justify-between p-7`}>
              <span className={`pill self-start ${a.tone.includes("paper") || a.tone.includes("ember") ? "pill-ink" : "pill-paper"}`}>{a.tag}</span>
              <div>
                <h3 className="text-2xl font-medium">{a.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed opacity-80">{a.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Market() {
  return (
    <section id="market" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mb-10">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            Hong Kong writes the law.
            <br />
            We write the standard.
          </h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-12">
          <Reveal className="tile tile-paper tile-lift p-7 md:col-span-4">
            <p className="eyebrow">Pilot</p>
            <p className="num mt-4 text-6xl">
              <Counter to={15000} />
            </p>
            <p className="mt-3 text-[15px] opacity-75">riders, two platforms, one insurer, one regulatory sandbox.</p>
          </Reveal>
          <Reveal delay={0.08} className="tile tile-dusk tile-flow tile-grain tile-lift p-7 md:col-span-4">
            <p className="eyebrow !opacity-80">Scale</p>
            <p className="num mt-4 text-6xl">
              <Counter to={84} suffix="m" />
            </p>
            <p className="mt-3 text-[15px] opacity-90">workers already insured next door, with flat premiums and manual claims.</p>
          </Reveal>
          <Reveal delay={0.16} className="tile tile-night tile-lift p-7 md:col-span-4">
            <p className="eyebrow">Who pays</p>
            <ul className="mt-5 space-y-3 text-lg">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-violet-2" /> Platforms, per insured rider
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-peach" /> Insurers, per verified event
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-lemon" /> Riders, never
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.2} className="tile tile-haze tile-grain tile-lift p-7 md:col-span-7">
            <p className="eyebrow">The wave</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="num text-3xl">Jan 2025</p>
                <p className="mt-2 text-sm opacity-70">Singapore makes platform injury cover mandatory.</p>
              </div>
              <div>
                <p className="num text-3xl">Jul 2026</p>
                <p className="mt-2 text-sm opacity-70">Mainland scheme goes nationwide. Hong Kong publishes its proposal.</p>
              </div>
              <div>
                <p className="num text-3xl">Late 2026</p>
                <p className="mt-2 text-sm opacity-70">Hong Kong framework due.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.25} className="tile tile-ink tile-lift flex flex-col justify-between p-7 md:col-span-5">
            <p className="eyebrow">What changes</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="num text-3xl">24 h</p>
                <p className="mt-2 text-sm opacity-70">to payout, target</p>
              </div>
              <div>
                <p className="num text-3xl">0</p>
                <p className="mt-2 text-sm opacity-70">claim forms</p>
              </div>
              <div>
                <p className="num text-3xl">1</p>
                <p className="mt-2 text-sm opacity-70">lookup to settle who pays</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Governance() {
  return (
    <section id="governance" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-12">
        <Reveal className="tile tile-night flex min-h-[360px] flex-col justify-between p-8 sm:p-10 md:col-span-5">
          <RecordTile />
          <div>
            <h2 className="display mt-8 text-4xl sm:text-5xl">
              Answers to the
              <br />
              rider first.
            </h2>
            <Link href="/rider" className="arrow-link mt-6">
              See the consent screen <Arrow />
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 md:col-span-7">
          {[
            ["Opt in, per shift", "One tap to start, one tap to stop. Off shift, nothing is read."],
            ["The rider owns the raw data", "Routes, speed and motion never leave the phone. Only the event does."],
            ["Events, never scores", "Platforms and insurers see a crash, a shift flag and a weather band. Nothing else."],
            ["Alerts go to the worker", "Heat and fatigue warnings reach the rider. Never the platform."],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.05} className="tile tile-paper tile-lift p-6">
              <div className="plus" />
              <h3 className="mt-5 text-lg font-medium">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-75">{b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Limits() {
  return (
    <section id="limits" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto grid max-w-[1400px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal className="tile tile-paper p-7">
          <h2 className="display text-4xl">What we do not claim yet.</h2>
        </Reveal>
        {[
          ["Falls are a proxy", "The model is trained on public fall data and synthetic rider scenarios. Helmet drop tests and road trials come next."],
          ["Heuristics, not diagnoses", "Fatigue and heat are alerts for the rider, not clinical measures."],
          ["Modelled economics", "Payout and premium come from sourced inputs with a low to high range. No insurer has signed yet."],
        ].map(([t, b], i) => (
          <Reveal key={t} delay={i * 0.05} className="tile tile-night tile-lift p-6">
            <h3 className="text-lg font-medium">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-70">{b}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="tile tile-dusk tile-flow tile-grain flex min-h-[380px] flex-col items-start justify-end gap-8 p-8 sm:p-12 md:flex-row md:items-end md:justify-between">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            Same rider. Same crash.
            <br />
            Two different worlds.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className="inline-flex items-center gap-3 rounded-full bg-paper px-6 py-3.5 text-ink transition hover:bg-ink hover:text-paper">
              Run the pipeline <Arrow />
            </Link>
            <Link href="/rider" className="inline-flex items-center gap-3 rounded-full border border-white/60 px-6 py-3.5 transition hover:bg-paper hover:text-ink">
              Use your phone <Arrow />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
