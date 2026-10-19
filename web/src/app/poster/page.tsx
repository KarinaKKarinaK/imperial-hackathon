import results from "@/lib/ml/results.json";

export const metadata = { title: "Poster. Metrics" };

type CI = { value: number; lo: number; hi: number };
const r = results as { n_trials: number; n_subjects: number; models: Record<string, { umafall: Record<string, CI>; synthetic_by_scenario: Record<string, number> }> };
const gbm = r.models.gbm.umafall;
const rule = r.models.rule.umafall;
const pct = (c: CI) => `${(c.value * 100).toFixed(0)}%`;
const ci = (c: CI) => `[${(c.lo * 100).toFixed(0)}, ${(c.hi * 100).toFixed(0)}]`;

const PILLARS = [
  { name: "Engineering", color: "bg-violet text-white", cells: ["Framed it as a verification problem", "Clip, phone client, detector, open schema", "Drop rig, precision and recall on own data", "Phone-only tier first, helmet tier next"] },
  { name: "Science", color: "bg-paper text-ink border border-ink/15", cells: ["Quantified rider counts, claims, compensation rate", "Sensor placement, sampling, calibration", "Leave-subjects-out, bootstrap intervals, sweep", "Uncertainty carried into the financial model"] },
  { name: "Medicine", color: "bg-peach text-ink", cells: ["Uncompensated injury as a public health gap", "Triage by mechanism and magnitude", "Impact thresholds from biomechanics literature", "Worker-protective framing for the heat review"] },
  { name: "Business", color: "bg-lemon text-ink", cells: ["Found the apportionment clause nobody can operate", "Parametric trigger, two tiers, who pays", "Pilot and scale columns, risk register", "Sandbox with one insurer, then cross-border"] },
];
const STAGES = ["Problem", "Design", "Validation", "Translation"];

// A0 poster at 1:1 CSS scale is 841 x 1189 mm. This page lays out at that
// ratio and prints to PDF from the browser: File, Print, Save as PDF, A0 or
// scale to fit. Everything on it is on the site too.
export default function PosterPage() {
  return (
    <main className="bg-ink px-4 py-8 text-paper print:bg-white print:p-0 print:text-ink">
      <style>{`@page { size: A0 portrait; margin: 12mm; } @media print { .no-print { display: none } .poster { width: 100%; } .tile { break-inside: avoid; } }`}</style>
      <p className="no-print mx-auto mb-4 max-w-[1100px] text-xs opacity-60">Print this page to PDF at A0 for the poster. The browser handles the scaling.</p>
      <div className="poster mx-auto grid max-w-[1100px] gap-3" style={{ aspectRatio: "841 / 1189" }}>
        {/* Header */}
        <div className="grid grid-cols-12 gap-3">
          <div className="tile tile-paper col-span-8 p-8">
            <span className="pill pill-ink">Metrics</span>
            <h1 className="display mt-4 text-5xl leading-none">
              Every crash gets a record.
              <br />
              Every record gets paid.
            </h1>
            <p className="mt-4 max-w-2xl text-base opacity-75">
              A verified work-injury event record for Hong Kong&apos;s delivery riders: a 3D-printed helmet clip and the phone they carry,
              a crash model with error bars, a triage alert, and a parametric payout. Built for paragraph 385 of the 2026 Policy Address.
            </p>
          </div>
          <div className="tile tile-dusk tile-grain col-span-4 flex flex-col justify-between p-6">
            <p className="eyebrow !opacity-80">The problem in four numbers</p>
            <div className="grid grid-cols-2 gap-4">
              {[["12,900", "riders, zero employers"], ["13%", "of injured riders compensated"], ["1 in 3", "riders on two apps at once"], ["5 yrs", "for one typhoon case to pay"]].map(([n, t]) => (
                <div key={n}>
                  <p className="num text-4xl">{n}</p>
                  <p className="text-xs opacity-85">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row: policy, pipeline, model */}
        <div className="grid grid-cols-12 gap-3">
          <div className="tile tile-night col-span-4 p-6">
            <p className="eyebrow">Policy anchor</p>
            <p className="mt-3 text-sm leading-relaxed">
              2026 Policy Address, para 385: statutory compensation for injuries at work for delivery platform workers. The July 2026
              proposal makes platforms liable on a no-fault basis and splits liability when a rider is on several apps. Nothing records the
              crash, so neither the claim nor the split can be verified. Outside Challenges 1 to 5: occupational health, not AI governance or
              infrastructure.
            </p>
            <p className="eyebrow mt-6">Evidence base</p>
            <p className="mt-2 text-sm opacity-80">
              19-row evidence table: C&amp;SD survey No. 81, Labour Department OSH 2024, High Court 2025, LWB proposal 2026, UMAFall, SisFall,
              concussion biomechanics, gig-economy safety literature.
            </p>
          </div>
          <div className="tile tile-paper col-span-4 p-6">
            <p className="eyebrow">From impact to payout</p>
            <ol className="mt-3 space-y-2 text-sm">
              {[
                ["Impact", "helmet and phone see acceleration above 6 g"],
                ["Detect", "ten features, gradient boosting, p of crash"],
                ["30 s", "one tap cancels, nothing leaves the phone"],
                ["Triage", "location, mechanism, probable profile to dispatch"],
                ["Record", "15 fields, names the app active at impact"],
                ["Payout", "fixed first tier within a day, hospital second tier"],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="mono text-xs opacity-50">0{i + 1}</span>
                  <span>
                    <strong className="font-medium">{t}.</strong> {b}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="tile tile-paper col-span-4 p-6">
            <p className="eyebrow">Model, leave-subjects-out</p>
            <p className="mt-1 text-xs opacity-60">
              UMAFall phone sensor, {r.n_trials} recordings, {r.n_subjects} subjects, 95% bootstrap intervals
            </p>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-wider opacity-60">
                <tr>
                  <th className="pb-1 font-medium">Model</th>
                  <th className="pb-1 font-medium">Recall</th>
                  <th className="pb-1 font-medium">Precision</th>
                  <th className="pb-1 font-medium">AUROC</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-ink/10">
                  <td className="py-1.5">Three-threshold rule</td>
                  <td className="py-1.5 mono text-xs">{pct(rule.recall)} {ci(rule.recall)}</td>
                  <td className="py-1.5 mono text-xs">{pct(rule.precision)} {ci(rule.precision)}</td>
                  <td className="py-1.5 mono text-xs">{rule.auroc.value.toFixed(3)}</td>
                </tr>
                <tr className="border-t border-ink/10 font-medium">
                  <td className="py-1.5">Gradient boosting (deployed)</td>
                  <td className="py-1.5 mono text-xs">{pct(gbm.recall)} {ci(gbm.recall)}</td>
                  <td className="py-1.5 mono text-xs">{pct(gbm.precision)} {ci(gbm.precision)}</td>
                  <td className="py-1.5 mono text-xs">{gbm.auroc.value.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs opacity-70">
              Synthetic rider scenarios, never trained on: riding, braking, pothole and set-down flagged 0%, crash{" "}
              {(r.models.gbm.synthetic_by_scenario.crash * 100).toFixed(0)}%. Worst false alarm on real data: a phone taken out to make a call.
            </p>
            <p className="mt-2 text-xs opacity-70">Helmet drop tests: [detection rate and interval from validation/runs, when complete].</p>
          </div>
        </div>

        {/* STEMB map */}
        <div className="tile tile-night p-6">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">STEMB integration map</p>
            <p className="text-xs opacity-60">What each pillar produced at each stage</p>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
            <div />
            {STAGES.map((s) => (
              <div key={s} className="pb-1 text-center text-[10px] uppercase tracking-wider opacity-60">
                {s}
              </div>
            ))}
            {PILLARS.map((p) => (
              <PillarRow key={p.name} p={p} />
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-sm opacity-85">
            Engineering built the sensor, detector and record. Science designed the evaluation and owns the uncertainty. Medicine framed
            the injury gap and the triage output. Business found the clause in the law that makes the record necessary and priced the
            pathway. No pillar could have shipped this alone.
          </p>
        </div>

        {/* Row: translation, governance, limits */}
        <div className="grid grid-cols-12 gap-3">
          <div className="tile tile-paper col-span-4 p-6">
            <p className="eyebrow">Translation</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Insurance Authority sandbox, one licensed insurer, one platform, 15,000 riders.</li>
              <li>Platforms pay per insured rider, insurers per verified event, riders never.</li>
              <li>Scale: 84 million workers in the mainland scheme, Singapore mandatory since 2025, no verification layer in either.</li>
              <li>Top risks: verification classed as claims handling, consent uptake, in-house copies. Answers: sandbox opinion, pilot consent study, neutrality.</li>
            </ul>
          </div>
          <div className="tile tile-haze tile-grain col-span-4 p-6">
            <p className="eyebrow">Governance</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Opt in per shift, one tap to stop. Off shift, nothing is read.</li>
              <li>The rider owns raw data and the record. Routes and speed never leave the phone.</li>
              <li>Platforms and insurers see events, never a per-rider score or alert.</li>
              <li>PDPO mapped principle by principle. Dual use named and designed out.</li>
            </ul>
          </div>
          <div className="tile tile-dusk tile-grain col-span-4 p-6">
            <p className="eyebrow !opacity-80">What we do not claim</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Falls on mats are a proxy for road crashes. Road trials are next.</li>
              <li>Fatigue and heat are alerts, not clinical measures.</li>
              <li>Money figures are illustrative until a sourced premium exists.</li>
              <li>The prototype is a dev board in a printed box, not a product.</li>
            </ul>
            <p className="mt-4 text-sm">Live: metricsfile.vercel.app</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function PillarRow({ p }: { p: (typeof PILLARS)[number] }) {
  return (
    <>
      <div className={`flex items-center rounded-xl px-3 py-2 font-medium ${p.color}`}>{p.name}</div>
      {p.cells.map((c) => (
        <div key={c} className="rounded-xl border border-white/10 px-3 py-2 leading-snug opacity-90">
          {c}
        </div>
      ))}
    </>
  );
}
