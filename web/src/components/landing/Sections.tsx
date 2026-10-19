import Link from "next/link";
import { Arrow } from "../Arrow";
import { Counter } from "../Counter";
import { Reveal } from "../Reveal";

export function Problem() {
  return (
    <section id="problem" className="px-4 pt-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            No record.
            <br />
            No proof.
            <br />
            No price.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <Reveal className="tile tile-paper p-7">
            <div className="plus" />
            <h3 className="mt-6 text-2xl font-medium">No employer</h3>
            <p className="mt-3 text-[15px] leading-relaxed opacity-80">
              Riders are independent contractors. The Employees&apos; Compensation Ordinance does not cover them. No sick pay, no medical
              cover, no injury compensation. One in three works for more than one app at once.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="tile tile-paper p-7">
            <div className="plus" />
            <h3 className="mt-6 text-2xl font-medium">No evidence</h3>
            <p className="mt-3 text-[15px] leading-relaxed opacity-80">
              When a rider goes down, nothing records it. Platforms cannot verify a work-time crash. Insurers cannot price a risk nobody
              has measured. The Foodpanda typhoon case needed five years and a High Court judge to establish what happened.
            </p>
          </Reveal>
          <Reveal delay={0.16} className="tile tile-violet tile-grain p-7">
            <div className="plus" />
            <h3 className="mt-6 text-2xl font-medium">A law without a record</h3>
            <p className="mt-3 text-[15px] leading-relaxed opacity-90">
              Paragraph 385 of the 2026 Policy Address promises statutory compensation. The July 2026 proposal makes platforms liable on a
              no-fault basis and splits liability when a rider is on several apps. Nobody can settle that split without a record of which
              job was active at impact.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const APPLICATIONS = [
  {
    title: "Delivery riders",
    tag: "Today",
    tone: "tile-violet tile-grain",
    body: "Two-wheeler platform workers under para 385. Crash record, triage, parametric payout, multi-platform apportionment.",
    lens: "Policy and social impact",
  },
  {
    title: "Construction",
    tag: "Next",
    tone: "tile-paper",
    body: "667,603 registered workers, the worst fatality rate of any sector, helmets already mandatory. The same clip, the same record.",
    lens: "Clinical evidence",
  },
  {
    title: "Outdoor cleaning and security",
    tag: "Next",
    tone: "tile-paper",
    body: "Hong Kong's heat warning is city-wide and not binding. A per-worker heat exposure record is what the review with the Observatory lacks.",
    lens: "Public health",
  },
  {
    title: "Ride-hailing and van drivers",
    tag: "Later",
    tone: "tile-ink",
    body: "The same event schema with the vehicle as the sensor host. Apportionment across apps is identical.",
    lens: "Go-to-market",
  },
  {
    title: "Hospital porters and ward staff",
    tag: "Later",
    tone: "tile-ink",
    body: "Falls and manual-handling injuries with no witness. A record that answers to the worker first, inside an employer that already insures.",
    lens: "Health workforce",
  },
  {
    title: "Mainland and Singapore schemes",
    tag: "Scale",
    tone: "tile-peach tile-grain",
    body: "84 million workers in the mainland injury scheme since July 2026, flat premiums, manual claims. Singapore mandatory since January 2025. Neither has a verification layer.",
    lens: "Cross-border strategy",
  },
];

export function Applications() {
  return (
    <section id="applications" className="px-4 pt-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
              One record.
              <br />
              Every body at work.
            </h2>
          </Reveal>
          <p className="max-w-md text-[15px] opacity-70">
            Riders are the entry point because the law names them. The schema does not care what the worker is standing on.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {APPLICATIONS.map((a, i) => (
            <Reveal key={a.title} delay={(i % 3) * 0.07} className={`tile ${a.tone} flex min-h-[240px] flex-col justify-between p-7`}>
              <div className="flex items-center justify-between">
                <span className={`pill ${a.tone.includes("ink") || a.tone.includes("violet") ? "pill-paper" : "pill-ink"}`}>{a.tag}</span>
                <span className="text-xs opacity-60">{a.lens}</span>
              </div>
              <div>
                <h3 className="text-2xl font-medium">{a.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed opacity-85">{a.body}</p>
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
    <section id="market" className="px-4 pt-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            Hong Kong writes the law.
            <br />
            We write the standard.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-12">
          <Reveal className="tile tile-paper p-7 md:col-span-4">
            <p className="eyebrow">Pilot</p>
            <p className="num mt-4 text-5xl sm:text-6xl">
              <Counter to={15000} />
            </p>
            <p className="mt-3 text-[15px] opacity-80">riders, two platforms, one licensed insurer, Insurance Authority sandbox.</p>
            <p className="mt-6 text-sm opacity-60">Worth low single-digit HK$ millions a year. Enough to prove the standard. We say so.</p>
          </Reveal>
          <Reveal delay={0.08} className="tile tile-violet tile-grain p-7 md:col-span-4">
            <p className="eyebrow !opacity-80">Scale</p>
            <p className="num mt-4 text-5xl sm:text-6xl">
              <Counter to={84} suffix="m" />
            </p>
            <p className="mt-3 text-[15px] opacity-90">
              workers in the mainland occupational injury scheme, nationwide since July 2026, 14 platforms. One platform alone has paid over
              3 billion yuan in premiums.
            </p>
            <p className="mt-6 text-sm opacity-80">Flat premiums, manual claims. No verification layer.</p>
          </Reveal>
          <Reveal delay={0.16} className="tile tile-ink p-7 md:col-span-4">
            <p className="eyebrow">Who pays</p>
            <ul className="mt-4 space-y-4 text-[15px]">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet" />
                <span>
                  <strong className="font-medium">Platforms.</strong> Liable under the new law. A monthly fee per insured rider.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-peach" />
                <span>
                  <strong className="font-medium">Insurers.</strong> Pricing and claims. A fee per verified event.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lemon" />
                <span>
                  <strong className="font-medium">Riders.</strong> Never.
                </span>
              </li>
            </ul>
            <p className="mt-6 text-sm opacity-60">
              Defensibility is neutrality. A platform cannot be the trusted record of its own liability.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="tile tile-paper tile-dots p-7 md:col-span-6">
            <p className="eyebrow">Regulatory wave</p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="num text-3xl">Jan 2025</p>
                <p className="mt-2 text-sm opacity-75">Singapore: platform worker injury insurance mandatory.</p>
              </div>
              <div>
                <p className="num text-3xl">Jul 2026</p>
                <p className="mt-2 text-sm opacity-75">Mainland scheme nationwide. Hong Kong no-fault proposal published.</p>
              </div>
              <div>
                <p className="num text-3xl">2026</p>
                <p className="mt-2 text-sm opacity-75">Hong Kong framework targeted for introduction by year end.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.25} className="tile tile-peach tile-grain flex flex-col justify-between p-7 md:col-span-6">
            <p className="eyebrow">Social return, what the hackathon scores</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="num text-3xl">24 h</p>
                <p className="mt-2 text-sm opacity-75">to payout, target, against months today</p>
              </div>
              <div>
                <p className="num text-3xl">0</p>
                <p className="mt-2 text-sm opacity-75">claim forms for a verified event</p>
              </div>
              <div>
                <p className="num text-3xl">1</p>
                <p className="mt-2 text-sm opacity-75">lookup to settle multi-platform liability</p>
              </div>
              <div>
                <p className="num text-3xl">244</p>
                <p className="mt-2 text-sm opacity-75">fatal work injury cases in 2024 with no objective record standard</p>
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
    <section id="governance" className="px-4 pt-20 sm:px-6">
      <div className="mx-auto grid max-w-[1400px] gap-3 md:grid-cols-12">
        <Reveal className="tile tile-ink p-7 md:col-span-5 sm:p-10">
          <h2 className="display text-4xl sm:text-5xl">
            Answers to the
            <br />
            rider first.
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed opacity-80">
            Continuous telemetry from a worker is a surveillance tool if you let it be. These are design rules, not promises, and they are
            enforced in the schema.
          </p>
          <Link href="/rider" className="arrow-link mt-8">
            See the consent screen <Arrow />
          </Link>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 md:col-span-7">
          {[
            ["Opt-in, per shift, revocable", "Consent is given on the phone in plain language and can be withdrawn with one tap. No shift, no data."],
            ["The rider owns the raw data", "Accelerometer traces, routes and speed never leave the device. Only the event record does."],
            ["Events, never scores", "Platforms and insurers see a crash event, a shift flag and a weather band. No per-rider risk score exists upstream."],
            ["Alerts go to the worker", "Fatigue and heat warnings are shown to the rider only. They never reach a platform, a dispatcher or an insurer."],
            ["PDPO mapped", "Purpose limitation, retention period and access rights under the Personal Data (Privacy) Ordinance, written down before the app."],
            ["Dual use named", "The same sensor could be used against riders. We say so, and the controls above are how we stop it."],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.05} className="tile tile-paper p-6">
              <div className="plus" />
              <h3 className="mt-5 text-lg font-medium">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-80">{b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Limits() {
  return (
    <section id="limits" className="px-4 pt-20 sm:px-6">
      <div className="mx-auto grid max-w-[1400px] gap-3 md:grid-cols-12">
        <Reveal className="tile tile-paper p-7 md:col-span-4">
          <h2 className="display text-4xl">What this does not prove.</h2>
          <p className="mt-6 text-[15px] leading-relaxed opacity-80">
            Judges asked for honesty about limits. Here they are, on the front page.
          </p>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 md:col-span-8">
          {[
            ["A flat drop is not a collision", "Drop tests show the detector sees a head impact. They do not show it sees every crash. Road trials come next."],
            ["Fatigue and heat are heuristics", "Shift hours plus speed variance, and an apparent temperature band. Useful alerts, not validated clinical measures."],
            ["Small samples", "Detection rates are reported with 95% confidence intervals. The intervals are wide. We show them anyway."],
            ["Illustrative economics", "Premiums and payouts on this site are placeholders until the financial model supplies sourced figures."],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.05} className="tile tile-ink p-6">
              <h3 className="text-lg font-medium">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-75">{b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="px-4 pt-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="tile tile-violet tile-grain flex flex-col items-start justify-between gap-8 p-8 sm:p-12 md:flex-row md:items-end">
          <div>
            <p className="eyebrow !opacity-80">Live now</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl lg:text-6xl">
              Same rider. Same crash.
              <br />
              Two different worlds.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className="inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-paper transition hover:bg-paper hover:text-ink">
              Run the pipeline <Arrow />
            </Link>
            <Link href="/rider" className="inline-flex items-center gap-3 rounded-full border border-white/60 px-6 py-3.5 transition hover:bg-paper hover:text-ink">
              Use your phone as the sensor <Arrow />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
