import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "The record. Metrics" };

const SAMPLE = {
  id: "EVT-7K2M9Q",
  riderId: "rider-4f2a",
  platform: "Platform A",
  jobId: "ORD-4471",
  ts: "2026-10-19T06:32:07.412Z",
  lat: 22.3218,
  lng: 114.1762,
  peakG: 14.2,
  tiltDeg: 82,
  stillSec: 8.0,
  confidence: 0.97,
  status: "paid",
  cancelDeadline: "2026-10-19T06:32:37.412Z",
  triage: { profile: "Probable blunt force trauma. Suspect concussion, limb fracture.", mechanism: "Moderate-speed deceleration" },
  insurance: { premiumWindowHkd: 0.84, payoutHkd: 8000, paidAt: "2026-10-19T06:32:37.901Z" },
  context: { rain: true, heat: "amber", fatigue: 0.31 },
};

const FIELDS: [string, string, string][] = [
  ["id", "Event id", "Unique, time-ordered. The reference every party quotes."],
  ["riderId", "Rider", "A pseudonymous id. The rider maps it to a person. Nobody else can."],
  ["platform", "Platform at impact", "Which app the rider was working for at the moment of impact. This is the field that makes the July 2026 apportionment rule operable."],
  ["jobId", "Job at impact", "The order or trip id the platform issued. Platform and rider can both verify it."],
  ["ts", "Timestamp", "UTC, millisecond. Set by the device, confirmed by the server on receipt."],
  ["lat, lng", "Location", "Where the impact happened. Sent only with an event, never as a route."],
  ["peakG", "Peak acceleration", "Maximum resultant acceleration in the 6 second window, in g. From the helmet sensor or the phone."],
  ["tiltDeg", "Orientation change", "Angle between the gravity vector before and after impact. A fall swings it by 60 degrees or more."],
  ["stillSec", "Stillness", "Longest run of near-zero motion after impact. The signal that separates a crash from a pothole."],
  ["confidence", "Model probability", "Output of the gradient boosting detector trained on public fall data and our drop tests. Not a rule, not a guess."],
  ["status", "Status", "detected, cancelled by the rider inside 30 seconds, confirmed, or paid."],
  ["cancelDeadline", "Cancel deadline", "Timestamp plus 30 seconds. One tap before this and nothing leaves the phone."],
  ["triage", "Triage note", "Probable trauma profile and mechanism, for the dispatcher. Probable, never a diagnosis."],
  ["insurance", "Insurance", "Premium for the active window, the fixed payout, and when it was paid. The parametric trigger is the event itself."],
  ["context", "Exposure context", "Rain, heat band and the rider's fatigue index at the time. Used for pricing, never shared per rider."],
];

export default function RecordPage() {
  return (
    <main>
      <Nav />
      <section className="px-4 pt-10 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 max-w-3xl">
            <span className="pill pill-outline">The standard</span>
            <h1 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">One record. Fifteen fields.</h1>
            <p className="mt-6 max-w-xl text-lg opacity-75">
              Everything a rider, a platform, an insurer and a court need to agree on what happened. Nothing they do not.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="tile tile-night p-6 sm:p-8 lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
              <p className="eyebrow">event.json</p>
              <pre className="mono mt-4 overflow-x-auto text-[13px] leading-relaxed text-paper/90">{JSON.stringify(SAMPLE, null, 2)}</pre>
            </div>
            <div className="grid gap-4 lg:col-span-7">
              {FIELDS.map(([k, t, b], i) => (
                <div key={k} className={`tile tile-lift p-6 ${i === 2 ? "tile-dusk tile-grain" : "tile-paper"}`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-xl font-medium">{t}</h2>
                    <code className="mono text-xs opacity-60">{k}</code>
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed opacity-80">{b}</p>
                </div>
              ))}
              <div className="tile tile-haze tile-grain p-6">
                <h2 className="text-xl font-medium">What is not in the record</h2>
                <p className="mt-2 text-[15px] leading-relaxed opacity-80">
                  No route. No speed history. No raw sensor trace. No fatigue or heat score per rider. Those stay on the phone. The
                  record is the only thing that leaves it, and only after thirty seconds of silence.
                </p>
                <Link href="/demo" className="arrow-link mt-5">
                  Watch one get created <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
