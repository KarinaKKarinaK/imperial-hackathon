import results from "@/lib/ml/results.json";
import { Reveal } from "../Reveal";

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
            Trained and tested on {r.n_trials} recordings from {r.n_subjects} people in the UMAFall dataset, leave-subjects-out, and
            stress-tested on synthetic rider scenarios it never saw. 95% bootstrap intervals.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-12">
          <Reveal className="tile tile-dusk tile-flow tile-grain p-7 md:col-span-4">
            <p className="eyebrow !opacity-80">Deployed: {LABEL[r.exported]}</p>
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="num text-5xl">{pct(best.umafall.recall)}</p>
                <p className="mt-2 text-sm opacity-90">recall</p>
                <p className="text-xs opacity-70">CI {ci(best.umafall.recall)}</p>
              </div>
              <div>
                <p className="num text-5xl">{pct(best.umafall.precision)}</p>
                <p className="mt-2 text-sm opacity-90">precision</p>
                <p className="text-xs opacity-70">CI {ci(best.umafall.precision)}</p>
              </div>
              <div>
                <p className="num text-5xl">{best.umafall.auroc.value.toFixed(3)}</p>
                <p className="mt-2 text-sm opacity-90">AUROC</p>
              </div>
              <div>
                <p className="num text-5xl">{pct(r.models.rule.umafall.recall)}</p>
                <p className="mt-2 text-sm opacity-90">recall of the old rule</p>
                <p className="text-xs opacity-70">same data</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="tile tile-paper p-6 md:col-span-8">
            <p className="eyebrow">Leave-subjects-out, UMAFall phone sensor</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider opacity-60">
                  <tr>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium">Precision</th>
                    <th className="pb-2 font-medium">Recall</th>
                    <th className="pb-2 font-medium">F1</th>
                    <th className="pb-2 font-medium">AUROC</th>
                    <th className="pb-2 font-medium">Brier</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER.map((m) => {
                    const u = r.models[m].umafall;
                    const dep = m === r.exported;
                    return (
                      <tr key={m} className={`border-t border-ink/10 ${dep ? "font-medium" : ""}`}>
                        <td className="py-2.5 pr-3">
                          {LABEL[m]}
                          {dep && <span className="pill pill-violet ml-2 !py-1 !text-xs">deployed</span>}
                        </td>
                        {(["precision", "recall", "f1", "auroc", "brier"] as const).map((k) => (
                          <td key={k} className="py-2.5 pr-3">
                            <span className="mono">{u[k].value.toFixed(3)}</span>
                            <span className="ml-1 text-xs opacity-50">
                              [{u[k].lo.toFixed(2)}, {u[k].hi.toFixed(2)}]
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="tile tile-night p-6 md:col-span-8">
            <p className="eyebrow">Synthetic rider scenarios, never trained on. Share flagged as a crash.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider opacity-60">
                  <tr>
                    <th className="pb-2 font-medium">Model</th>
                    {SCEN.map((s) => (
                      <th key={s} className="pb-2 font-medium">
                        {SCEN_LABEL[s]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ORDER.map((m) => (
                    <tr key={m} className="border-t border-white/10">
                      <td className="py-2.5 pr-3">{LABEL[m]}</td>
                      {SCEN.map((s) => {
                        const v = r.models[m].synthetic_by_scenario[s];
                        const good = s === "crash" ? v >= 0.8 : v <= 0.1;
                        return (
                          <td key={s} className={`mono py-2.5 pr-3 ${good ? "" : "text-peach"}`}>
                            {(v * 100).toFixed(0)}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs opacity-60">Only the crash column should be high. Orange marks where a model gets it wrong.</p>
          </Reveal>

          <Reveal delay={0.16} className="tile tile-haze tile-grain p-6 md:col-span-4">
            <p className="eyebrow">What the numbers do not say</p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed">
              <li>Falls by volunteers onto mats are a proxy for crashes on a road.</li>
              <li>The phone was in a trouser pocket, not on a helmet. Our drop tests add the helmet column.</li>
              <li>The worst false alarm is a phone taken out of a pocket to make a call. The 30 second cancel exists for exactly this.</li>
              <li>Synthetic scenarios are our model of the signal, not the world.</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
