import riders from "@/lib/riders.json";
import { Reveal } from "../Reveal";

// Fill web/src/lib/riders.json after the interviews (see
// submission/RIDER_INTERVIEWS.md). Until there is at least one quote this
// section renders nothing, so the site never shows invented voices.
type Quote = { text: string; translation?: string; who: string; district?: string; years?: number };
type Data = { updated: string | null; asked: number; crashStory: number; wouldWear: number; worries: string[]; quotes: Quote[] };

const d = riders as Data;

export function Riders() {
  if (!d.quotes.length) return null;
  return (
    <section id="riders" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mb-10 max-w-3xl">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            We asked the riders.
            <br />
            Here is what they said.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] opacity-70">
            {d.asked} riders, Kowloon, {d.updated}. Quoted with written consent, anonymised. Verbatim, translated underneath.
          </p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-12">
          <Reveal className="tile tile-dusk tile-flow tile-grain flex flex-col justify-between p-7 md:col-span-4">
            <p className="eyebrow !opacity-80">In numbers</p>
            <div className="mt-6 grid grid-cols-1 gap-6">
              <div>
                <p className="num text-6xl">
                  {d.crashStory} of {d.asked}
                </p>
                <p className="mt-2 text-sm opacity-90">had a crash story of their own or a friend&apos;s</p>
              </div>
              <div>
                <p className="num text-6xl">
                  {d.wouldWear} of {d.asked}
                </p>
                <p className="mt-2 text-sm opacity-90">would wear the clip if it paid out in a day</p>
              </div>
            </div>
            {d.worries.length > 0 && (
              <div className="mt-6">
                <p className="eyebrow !opacity-80">What worried them</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.worries.map((w) => (
                    <span key={w} className="pill pill-paper">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
          <div className="grid gap-4 md:col-span-8 sm:grid-cols-2">
            {d.quotes.map((q, i) => (
              <Reveal key={i} delay={i * 0.06} className={`tile p-7 ${i === 0 ? "tile-paper" : "tile-night"}`}>
                <p className="display text-2xl leading-snug sm:text-3xl">&ldquo;{q.text}&rdquo;</p>
                {q.translation && <p className="mt-3 text-sm opacity-70">{q.translation}</p>}
                <p className="mt-5 text-xs opacity-60">
                  {q.who}
                  {q.district ? `, ${q.district}` : ""}
                  {q.years ? `, ${q.years} years riding` : ""}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
