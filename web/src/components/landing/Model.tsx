import results from "@/lib/ml/results.json";
import { Reveal } from "../Reveal";
import { BarChart, DotPlot, Heatmap } from "./Charts";

type CI = { value: number; lo: number; hi: number };
type R = {
  n_trials: number;
  n_falls: number;
  n_subjects: number;
  exported: string;
  models: Record<string, { umafall: Record<string, CI>; synthetic_by_scenario: Record<string, number> }>;
};

const r = results as R;
const ORDER = ["rule", "logreg", "gbm", "mlp", "cnn"];
const LABEL: Record<string, string> = {
  rule: "Three-threshold rule",
  logreg: "Logistic regression",
  gbm: "Gradient boosting",
  mlp: "Small neural net",
  cnn: "1D convolutional net",
};
const SCEN = ["riding", "braking", "pothole", "set_down", "bag_drop", "crash"];
const SCEN_LABEL: Record<string, string> = { riding: "Riding", braking: "Hard brake", pothole: "Pothole", set_down: "Set down", bag_drop: "Bag drop", crash: "Crash" };

const pct = (c: CI) => `${(c.value * 100).toFixed(0)}%`;
const ci = (c: CI) => `${(c.lo * 100).toFixed(0)} to ${(c.hi * 100).toFixed(0)}`;

export function Model() {
  const best = r.models[r.exported];
  return (
    <section id="model" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mb-10 max-w-3xl">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            Not a rule.
            <br />A model, with error bars.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] opacity-70">
            Trained and tested on {r.n_trials} recordings from {r.n_subjects} people in the UMAFall dataset, leave-subjects-out, then
            stress-tested on synthetic rider scenarios it never saw. 95% bootstrap intervals.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-12">
          <Reveal className="tile tile-dusk tile-flow tile-grain flex flex-col justify-between p-7 md:col-span-4">
            <p className="eyebrow !opacity-80">Deployed: {LABEL[r.exported]}</p>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
              <div>
                <p className="num text-6xl">{pct(best.umafall.recall)}</p>
                <p className="mt-2 text-sm opacity-90">recall</p>
                <p className="text-xs opacity-70">CI {ci(best.umafall.recall)}</p>
              </div>
              <div>
                <p className="num text-6xl">{pct(best.umafall.precision)}</p>
                <p className="mt-2 text-sm opacity-90">precision</p>
                <p className="text-xs opacity-70">CI {ci(best.umafall.precision)}</p>
              </div>
              <div>
                <p className="num text-6xl">{pct(r.models.rule.umafall.recall)}</p>
                <p className="mt-2 text-sm opacity-90">recall of the old rule</p>
                <p className="text-xs opacity-70">same data, same split</p>
              </div>
              <div>
                <p className="num text-6xl">{best.umafall.auroc.value.toFixed(2)}</p>
                <p className="mt-2 text-sm opacity-90">AUROC</p>
                <p className="text-xs opacity-70">CI {best.umafall.auroc.lo.toFixed(3)} to {best.umafall.auroc.hi.toFixed(3)}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="tile tile-paper p-6 md:col-span-8 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow">Precision and recall, leave-subjects-out</p>
              <p className="text-xs opacity-50">whiskers are 95% intervals</p>
            </div>
            <div className="mt-5">
              <BarChart
                rows={ORDER.map((m) => ({ key: m, label: LABEL[m], values: r.models[m].umafall }))}
                metrics={[
                  { key: "recall", label: "recall", gradient: "violet" },
                  { key: "precision", label: "precision", gradient: "peach" },
                ]}
                highlight={r.exported}
              />
            </div>
          </Reveal>

          <Reveal delay={0.12} className="tile tile-night p-6 md:col-span-5 sm:p-8">
            <p className="eyebrow">AUROC, zoomed</p>
            <div className="mt-5">
              <DotPlot rows={ORDER.map((m) => ({ key: m, label: LABEL[m], ci: r.models[m].umafall.auroc }))} highlight={r.exported} />
            </div>
            <p className="mt-2 text-xs opacity-60">All five rank well. The rule ranks falls fine, it just sets its threshold where it misses half of them.</p>
          </Reveal>

          <Reveal delay={0.16} className="tile tile-night p-6 md:col-span-7 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow">Synthetic rider scenarios, never trained on</p>
              <p className="text-xs opacity-50">share flagged as a crash</p>
            </div>
            <div className="mt-5">
              <Heatmap
                rows={ORDER.map((m) => ({ key: m, label: LABEL[m], values: r.models[m].synthetic_by_scenario }))}
                cols={SCEN}
                colLabels={SCEN_LABEL}
                highlight={r.exported}
              />
            </div>
            <p className="mt-3 text-xs opacity-60">Violet should be full in the crash column. Orange anywhere else is a false alarm.</p>
          </Reveal>

          <Reveal delay={0.2} className="tile tile-haze tile-grain p-6 md:col-span-12 sm:p-8">
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <p className="eyebrow">What the numbers do not say</p>
              </div>
              {[
                "Falls by volunteers onto mats are a proxy for crashes on a road.",
                "The phone was in a trouser pocket, not on a helmet. Our drop tests add the helmet column.",
                "The worst false alarm is a phone taken out to make a call. The 30 second cancel exists for exactly this.",
              ].map((t) => (
                <p key={t} className="text-[15px] leading-relaxed">
                  {t}
                </p>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
