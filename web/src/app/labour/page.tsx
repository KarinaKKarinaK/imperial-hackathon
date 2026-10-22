import { Suspense } from "react";
import { connection } from "next/server";
import { labourAggregate, withStore } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Labour view. Metrics" };

type Agg = ReturnType<typeof labourAggregate>;

// Labour Department and Tripartite Committee view. Read straight from the
// store on every request, the same numbers GET /api/labour returns.
export default function LabourPage() {
  return (
    <main>
      <Nav />
      <Suspense fallback={<p className="mx-auto max-w-[1400px] px-4 pt-10 text-sm opacity-60 sm:px-6">Loading the aggregates.</p>}>
        <LabourBody />
      </Suspense>
      <Footer />
    </main>
  );
}

async function LabourBody() {
  await connection();
  let a: Agg;
  try {
    a = await withStore(() => labourAggregate());
  } catch {
    return <p className="mx-auto max-w-[1400px] px-4 pt-10 text-sm opacity-70 sm:px-6">Storage is busy. Reload the page in a moment.</p>;
  }
  const hazards = a.hazards; // already ranked by rate, worst first
  const labelTotal = a.labels.false_alarm + a.labels.real_fall + a.labels.unsure;
  const generated = new Date(a.generatedAt).toLocaleString("en-GB", { timeZone: "Asia/Hong_Kong", hour12: false });
  return (
    <section className="px-4 pt-10 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-4 md:grid-cols-12">
          <div className="tile tile-paper p-7 md:col-span-7 sm:p-10">
            <span className="pill pill-ink">Labour Department, Tripartite Committee</span>
            <h1 className="display mt-6 text-5xl sm:text-6xl">Where riders get hurt, and under what pressure.</h1>
            <p className="mt-6 max-w-xl text-lg opacity-75">
              Aggregates only. No rider ids, no exact times, no exact places. Hours are grouped into bands and hazards into 50 m cells.
            </p>
            <p className="mt-3 text-sm opacity-60">
              Sample events are included and counted below. Riders&apos; own cancelled alerts are false alarms and are left out.
            </p>
          </div>
          <div className="tile tile-dusk tile-grain flex flex-col justify-between p-7 md:col-span-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat n={a.total} label="events" />
              <Stat n={a.multiApp} label="on two or more apps" />
              <Stat n={a.tierTwo} label="with a hospital claim" />
              <Stat n={a.samples} label="of them samples" />
            </div>
            <p className="mt-8 text-xs opacity-70">Generated {generated} HKT. Updates on every load.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="tile tile-night p-6 sm:p-8 md:col-span-2">
            <p className="eyebrow">Time left on the delivery clock at impact</p>
            <p className="mt-2 max-w-2xl text-sm opacity-70">
              The time-pressure dataset. Each record carries the seconds left on the order countdown, so injuries can be set against delivery
              deadlines across platforms.
            </p>
            <Bars data={a.byClock} total={a.total} className="mt-5" />
          </div>
          <Panel title="Travel mode" data={a.byMode} total={a.total} />
          <Panel title="Hour of day, HKT" data={a.byHour} total={a.total} />
          <Panel title="Heat band" data={a.byHeat} total={a.total} />
          <Panel title="Rain" data={a.byRain} total={a.total} />
          <div className="tile tile-night p-6 sm:p-8 md:col-span-2">
            <p className="eyebrow">What riders said it was</p>
            <p className="mt-2 max-w-2xl text-sm opacity-70">
              After a cancel or a payout the rider can tap one label. These are the start of a real-world labelled dataset for retraining the
              detector, counted over every event including cancelled ones. Weak labels: one tap, not checked.
            </p>
            <Bars data={{ "false alarm": a.labels.false_alarm, "real fall": a.labels.real_fall, "not sure": a.labels.unsure }} total={labelTotal} className="mt-5" />
          </div>
          <div className="tile tile-ink p-6 sm:p-8 md:col-span-2">
            <p className="eyebrow">Real data in, research mode</p>
            <p className="mt-2 max-w-2xl text-sm opacity-70">
              Riders who opt in send 60 s of normal riding every 10 minutes and the 6 s behind each alarm with their own label. No location, no
              rider id. These ride hours are what the real false alarm rate per riding hour is measured on, replacing simulated falls and our
              synthetic ride.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div><p className="num text-4xl">{a.field.rideHours}</p><p className="mt-1 text-xs opacity-60">hours of real riding donated</p></div>
              <div><p className="num text-4xl">{a.field.rides}</p><p className="mt-1 text-xs opacity-60">ride segments</p></div>
              <div><p className="num text-4xl">{a.field.events}</p><p className="mt-1 text-xs opacity-60">labelled alarm windows</p></div>
            </div>
          </div>
        </div>

        <div className="tile tile-paper mt-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow">Published hazard cells</p>
            <p className="text-xs opacity-60">{hazards.length} cell(s)</p>
          </div>
          <p className="mt-2 max-w-2xl text-sm opacity-70">
            Hard jolts and hard brakes that were not crashes, on a grid of about 50 m. A cell is published only once it holds at least {a.hazardMin}{" "}
            events, so one rider&apos;s path cannot be rebuilt from it.
          </p>
          <p className="mt-2 max-w-2xl text-sm opacity-70">
            Ranked by rate: jolts per rider pass, shrunk toward the city mean with a prior of {a.hazardPrior} passes, so a cell with few passes is
            not ranked on luck.
          </p>
          {hazards.length === 0 ? (
            <p className="mt-5 text-sm opacity-50">No cell has reached {a.hazardMin} events yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider opacity-60">
                  <tr>
                    <th className="pb-2 font-medium">Cell</th>
                    <th className="pb-2 font-medium">Jolts</th>
                    <th className="pb-2 font-medium">Hard brakes</th>
                    <th className="pb-2 font-medium">Passes</th>
                    <th className="pb-2 font-medium">Rate per pass</th>
                    <th className="pb-2 font-medium">Map</th>
                  </tr>
                </thead>
                <tbody>
                  {hazards.map((h) => (
                    <tr key={`${h.lat},${h.lng}`} className="border-t border-ink/10">
                      <td className="mono py-2 pr-3 text-xs">
                        {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                      </td>
                      <td className="num py-2 pr-3">{h.bumps}</td>
                      <td className="num py-2 pr-3">{h.brakes}</td>
                      <td className="num py-2 pr-3">{h.passes ?? "n/a"}</td>
                      <td className="num py-2 pr-3">{h.rate === undefined ? "n/a" : h.rate.toFixed(2)}</td>
                      <td className="py-2">
                        <a href={`https://maps.google.com/?q=${h.lat},${h.lng}`} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-2">
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-6 text-xs opacity-60">
            Raw numbers: <a href="/api/labour" className="mono underline underline-offset-2">/api/labour</a>
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="num text-5xl">{n}</p>
      <p className="mt-2 text-sm opacity-90">{label}</p>
    </div>
  );
}

function Panel({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  return (
    <div className="tile tile-ink p-6 sm:p-8">
      <p className="eyebrow">{title}</p>
      <Bars data={data} total={total} className="mt-5" />
    </div>
  );
}

function Bars({ data, total, className = "" }: { data: Record<string, number>; total: number; className?: string }) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {Object.entries(data).map(([k, v]) => (
        <li key={k} className="grid grid-cols-[130px_1fr_32px] items-center gap-3 text-sm">
          <span className="capitalize opacity-85">{k}</span>
          <span className="h-2 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-violet" style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
          </span>
          <span className="num text-right">{v}</span>
        </li>
      ))}
    </ul>
  );
}
