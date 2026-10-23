import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RecordTile } from "@/components/landing/RecordTile";

export const metadata = { title: "The record. Metrics" };

type Party = "rider" | "platform" | "insurer" | "court";
const PARTIES: { key: Party; label: string }[] = [
  { key: "rider", label: "Rider" },
  { key: "platform", label: "Platform" },
  { key: "insurer", label: "Insurer" },
  { key: "court", label: "Court" },
];

type Field = { key: string; type: string; example: string; meaning: string; sees: Party[]; highlight?: boolean };
type Group = { title: string; note: string; fields: Field[] };

const GROUPS: Group[] = [
  {
    title: "Identity",
    note: "Who, which job, which app. The rider is pseudonymous. The platform field is the one the July 2026 proposal needs.",
    fields: [
      { key: "id", type: "string", example: "EVT-7K2M9Q", meaning: "Unique, time-ordered. The reference every party quotes.", sees: ["rider", "platform", "insurer", "court"] },
      { key: "riderId", type: "string", example: "rider-4f2a", meaning: "Random id on the device. Only the rider can map it to a person.", sees: ["rider", "insurer", "court"] },
      { key: "platform", type: "string", example: "Platform A", meaning: "The app the rider was working for at the moment of impact. Makes apportionment a lookup.", sees: ["rider", "platform", "insurer", "court"], highlight: true },
      { key: "jobId", type: "string", example: "ORD-4471", meaning: "The order the platform issued. Both sides can verify it.", sees: ["rider", "platform", "insurer", "court"] },
      { key: "activeJobs", type: "array", example: "A ORD-2417, B ORD-5083", meaning: "Every app with an open order at impact. A rider on two apps shows both, so neither platform can say the rider was working for the other. Signed.", sees: ["rider", "platform", "insurer", "court"], highlight: true },
      { key: "apportionment", type: "array", example: "A 0.5, B 0.5", meaning: "Each platform's share of liability. Shares add up to 1. Default rule until the regime sets one: equal split across open apps. Signed.", sees: ["rider", "platform", "insurer", "court"], highlight: true },
    ],
  },
  {
    title: "Impact",
    note: "What the sensor saw in the six seconds around the peak, and what the model made of it.",
    fields: [
      { key: "ts", type: "datetime", example: "2026-10-19T06:32:07Z", meaning: "Device time, confirmed by the server on receipt.", sees: ["rider", "platform", "insurer", "court"] },
      { key: "deadlineSec", type: "integer", example: "94", meaning: "Seconds left on the delivery countdown at impact, negative if already late. Across many events, the first dataset linking time pressure to injury.", sees: ["rider", "insurer", "court"], highlight: true },
      { key: "mode", type: "enum", example: "bicycle", meaning: "Travel mode at impact: motorcycle, bicycle, walking or unknown. Phone-only riders are covered on every mode.", sees: ["rider", "platform", "insurer", "court"] },
      { key: "lat, lng", type: "number", example: "22.3218, 114.1762", meaning: "Where. Sent only with an event, never as a route.", sees: ["rider", "insurer", "court"] },
      { key: "peakG", type: "number", example: "14.2", meaning: "Peak resultant acceleration in g, helmet or phone.", sees: ["rider", "insurer", "court"] },
      { key: "tiltDeg", type: "number", example: "82", meaning: "Change in gravity direction across the impact. A fall swings it past 60.", sees: ["rider", "insurer", "court"] },
      { key: "stillSec", type: "number", example: "8.0", meaning: "Longest run of near-zero motion after impact. Separates a crash from a pothole.", sees: ["rider", "insurer", "court"] },
      { key: "sources", type: "array", example: "helmet, phone", meaning: "Which sensors saw the impact. Both listed means helmet and phone agreed within one second. Signed.", sees: ["rider", "insurer", "court"] },
      { key: "confidence", type: "number", example: "0.97", meaning: "Crash probability from the gradient boosting model. A model output, not a rule.", sees: ["rider", "platform", "insurer", "court"] },
    ],
  },
  {
    title: "Outcome",
    note: "What happened next. The event is the parametric trigger, so these fields are the claim.",
    fields: [
      { key: "status", type: "enum", example: "paid", meaning: "detected, cancelled by the rider inside 30 s, confirmed, or paid.", sees: ["rider", "platform", "insurer", "court"] },
      { key: "cancelDeadline", type: "datetime", example: "ts + 30 s", meaning: "One tap before this and nothing leaves the phone.", sees: ["rider", "insurer"] },
      { key: "triage", type: "object", example: "Probable blunt trauma", meaning: "Mechanism and probable profile for dispatch. Probable, never a diagnosis.", sees: ["rider", "court"] },
      { key: "insurance", type: "object", example: "HK$5,450 paid", meaning: "Premium for the window, the fixed payout, and when it was paid.", sees: ["rider", "platform", "insurer", "court"] },
    ],
  },
  {
    title: "Integrity",
    note: "The impact facts, including the apps, the split, the sensors and the chain link, are signed when the record is created. The outcome is signed once final. Anyone can verify a copy without asking us.",
    fields: [
      { key: "signature", type: "string", example: "Ed25519, base64url", meaning: "Signature over id, rider, platform, open orders, split, sensors, previous hash, time, deadline, mode, location, impact numbers and context.", sees: ["rider", "platform", "insurer", "court"] },
      { key: "prevHash", type: "string", example: "sha256, hex", meaning: "Hash of this rider's previous record. Records form a chain, so a deleted record leaves a visible gap. Signed.", sees: ["rider", "insurer", "court"] },
      { key: "settlement", type: "object", example: "paid, HK$5,450", meaning: "The final outcome: status, when it was paid and the payout. Signed once final, together with the facts signature, so status and payout cannot be edited either.", sees: ["rider", "platform", "insurer", "court"] },
    ],
  },
  {
    title: "Context",
    note: "Exposure at the time. Used to price windows in aggregate, never shown per rider to a platform.",
    fields: [{ key: "context", type: "object", example: "rain, amber, 0.31", meaning: "Rain, heat band, fatigue index at the time of the event.", sees: ["rider", "insurer"] }],
  },
];

const MATRIX: { label: string; rider: boolean; platform: boolean; insurer: boolean; court: boolean }[] = [
  { label: "Raw motion, route, speed", rider: true, platform: false, insurer: false, court: false },
  { label: "Heat and fatigue alerts", rider: true, platform: false, insurer: false, court: false },
  { label: "Shift and job at impact", rider: true, platform: true, insurer: true, court: true },
  { label: "The event record", rider: true, platform: true, insurer: true, court: true },
  { label: "Aggregate event statistics", rider: false, platform: true, insurer: true, court: false },
];

function Dot({ on }: { on: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${on ? "bg-violet" : "bg-current opacity-15"}`} aria-label={on ? "yes" : "no"} />;
}

export default function RecordPage() {
  const total = GROUPS.reduce((n, g) => n + g.fields.length, 0);
  return (
    <main>
      <Nav />
      <section className="px-4 pt-10 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="tile tile-paper p-7 md:col-span-7 sm:p-10">
              <span className="pill pill-ink">The standard</span>
              <h1 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">One record. {total} fields.</h1>
              <p className="mt-6 max-w-xl text-lg opacity-75">
                Everything a rider, a platform, an insurer and a court need to agree on what happened. Nothing they do not.
              </p>
            </div>
            <div className="tile tile-dusk tile-flow tile-grain flex flex-col justify-between p-7 md:col-span-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="num text-5xl">{total}</p>
                  <p className="mt-2 text-sm opacity-90">fields</p>
                </div>
                <div>
                  <p className="num text-5xl">4</p>
                  <p className="mt-2 text-sm opacity-90">parties</p>
                </div>
                <div>
                  <p className="num text-5xl">0</p>
                  <p className="mt-2 text-sm opacity-90">routes stored</p>
                </div>
              </div>
              <RecordTile className="mt-8 opacity-90" />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-12">
            <div className="tile tile-night p-6 md:col-span-5 sm:p-8">
              <p className="eyebrow">Who sees what</p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[380px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider opacity-60">
                    <tr>
                      <th className="pb-3 font-medium">Data</th>
                      {PARTIES.map((p) => (
                        <th key={p.key} className="pb-3 text-center font-medium">
                          {p.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIX.map((m) => (
                      <tr key={m.label} className="border-t border-white/10">
                        <td className="py-3 pr-3">{m.label}</td>
                        {PARTIES.map((p) => (
                          <td key={p.key} className="py-3 text-center">
                            <Dot on={m[p.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs opacity-60">Platforms never see a per-rider score, a route, or an alert. They see the event they are liable for.</p>
            </div>
            <div className="tile tile-haze tile-grain flex flex-col justify-between p-6 md:col-span-7 sm:p-8">
              <div>
                <p className="eyebrow">What is not in the record</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ["No route", "GPS is sent once, with the event. Never as a trail."],
                    ["No speed history", "Speed is read on the phone for the fatigue alert and discarded."],
                    ["No raw trace", "The six second window is reduced to five numbers and a probability."],
                    ["No per-rider score", "Fatigue and heat exist as alerts on the rider's screen and nowhere else."],
                  ].map(([t, b]) => (
                    <div key={t}>
                      <p className="text-lg font-medium">{t}</p>
                      <p className="mt-1 text-sm opacity-75">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/demo" className="arrow-link">
                  Watch one get created <Arrow />
                </Link>
                <a href="/api/schema" className="arrow-link" target="_blank" rel="noreferrer">
                  JSON Schema <Arrow />
                </a>
                <a href="/api/verify" className="arrow-link" target="_blank" rel="noreferrer">
                  Public key <Arrow />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 tile tile-paper p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow">Data dictionary</p>
              <p className="text-xs opacity-50">dots: who can read the field</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider opacity-60">
                  <tr>
                    <th className="w-[170px] pb-3 font-medium">Field</th>
                    <th className="w-[90px] pb-3 font-medium">Type</th>
                    <th className="w-[190px] pb-3 font-medium">Example</th>
                    <th className="pb-3 font-medium">Meaning</th>
                    {PARTIES.map((p) => (
                      <th key={p.key} className="w-[64px] pb-3 text-center font-medium">
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map((g) => (
                    <GroupRows key={g.title} g={g} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function GroupRows({ g }: { g: Group }) {
  return (
    <>
      <tr>
        <td colSpan={4 + PARTIES.length} className="pb-2 pt-7">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-xl font-medium">{g.title}</span>
            <span className="text-sm opacity-60">{g.note}</span>
          </div>
        </td>
      </tr>
      {g.fields.map((f) => (
        <tr key={f.key} className={`border-t border-ink/10 align-top ${f.highlight ? "bg-violet/10" : ""}`}>
          <td className="py-3 pr-3">
            <code className="mono text-[13px]">{f.key}</code>
            {f.highlight && <span className="pill pill-violet ml-2 !py-0.5 !text-[10px]">apportionment</span>}
          </td>
          <td className="py-3 pr-3 text-xs opacity-60">{f.type}</td>
          <td className="py-3 pr-3 mono text-xs">{f.example}</td>
          <td className="py-3 pr-3 leading-relaxed opacity-85">{f.meaning}</td>
          {PARTIES.map((p) => (
            <td key={p.key} className="py-3 text-center">
              <Dot on={f.sees.includes(p.key)} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
