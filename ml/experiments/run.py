"""Crash detector experiments. Same protocol as train.py: 5-fold GroupKFold
by UMAFall subject, phone sensor, 6 s window, bootstrap CIs over trials.

Usage (from ml/): python experiments/run.py
Writes experiments/results.json and experiments/results_tables.md.
"""

from __future__ import annotations

import json
import time
from itertools import product
from pathlib import Path

import numpy as np
from sklearn.calibration import _SigmoidCalibration
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import average_precision_score, brier_score_loss
from sklearn.model_selection import GroupKFold

from common import EXTRA_NAMES, feats, flag_rates, synthetic, umafall

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from train import bootstrap, metrics  # noqa: E402

HERE = Path(__file__).resolve().parent
SHIPPED = dict(max_depth=3, learning_rate=0.08, max_iter=200)
COST_FN, COST_FP = 10.0, 1.0  # a missed crash costs ten false alarms
THRS = np.round(np.arange(0.05, 0.96, 0.05), 2)

t0 = time.time()
D = umafall()
y, groups, acts = D["y"], D["groups"], D["acts"]
WIN = D["win"]["phone"]
F = {False: feats(WIN, False), True: feats(WIN, True)}
FAUG = {s: {e: feats([w for w in D["win"][s] if w is not None], e) for e in (False, True)} for s in ("waist", "chest")}
AUG_IDX = {s: np.array([i for i, w in enumerate(D["win"][s]) if w is not None]) for s in ("waist", "chest")}

# synthetic: train seed, held-out test seed, shifted test seed. Disjoint seeds.
S_TR = synthetic(150, seed=101)
S_TE = synthetic(300, seed=202)
S_SH = synthetic(300, seed=303, shifted=True)
SF = {k: {e: feats(v[0], e) for e in (False, True)} for k, v in {"tr": S_TR, "te": S_TE, "sh": S_SH}.items()}
print(f"data ready {time.time() - t0:.0f}s")


def hgb(params):
    return HistGradientBoostingClassifier(**params, class_weight="balanced", random_state=0)


def fit_predict(params, Xtr, ytr, Xte_list):
    m = hgb(params).fit(Xtr, ytr)
    return [m.predict_proba(X)[:, 1] for X in Xte_list]


def train_rows(tr, extra, syn_mode, aug):
    """Training matrix for UMAFall rows tr plus optional synthetic and extra sensor rows."""
    X, yy = [F[extra][tr]], [y[tr]]
    for s in aug:
        keep = np.isin(AUG_IDX[s], tr)
        X.append(FAUG[s][extra][keep])
        yy.append(y[AUG_IDX[s][keep]])
    if syn_mode:
        Xs, ys, names = SF["tr"][extra], S_TR[1], np.array(S_TR[2])
        sel = np.ones(len(ys), bool) if syn_mode == "all" else np.isin(names, ["bag_drop", "set_down", "crash"])
        X.append(Xs[sel])
        yy.append(ys[sel])
    return np.vstack(X), np.concatenate(yy)


def inner_oof(params, tr, extra, syn_mode, aug):
    """Out-of-fold probabilities on the training subjects (inner GroupKFold, 4)."""
    p = np.zeros(len(tr))
    for itr, ite in GroupKFold(4).split(tr, y[tr], groups[tr]):
        Xtr, ytr = train_rows(tr[itr], extra, syn_mode, aug)
        p[ite] = fit_predict(params, Xtr, ytr, [F[extra][tr[ite]]])[0]
    return p


GRID = [dict(max_depth=d, learning_rate=lr, max_iter=it, min_samples_leaf=msl, l2_regularization=l2)
        for d, lr, it, msl, l2 in product([2, 3, 4], [0.04, 0.08, 0.15], [100, 200, 400], [10, 20, 40], [0.0, 1.0])]


def tune(tr, extra, syn_mode, aug):
    best, best_s = None, -1
    rng = np.random.default_rng(len(tr))
    for i in rng.choice(len(GRID), 30, replace=False):  # random search, 30 of 162 configs
        s = average_precision_score(y[tr], inner_oof(GRID[i], tr, extra, syn_mode, aug))
        if s > best_s:
            best, best_s = GRID[i], s
    return best


def cost_threshold(p, yy):
    costs = [COST_FN * np.sum((p < t) & (yy == 1)) + COST_FP * np.sum((p >= t) & (yy == 0)) for t in THRS]
    return float(THRS[int(np.argmin(costs))])


def run(name, extra=False, syn_mode=None, aug=(), params="shipped", calib=None, cost=False):
    t = time.time()
    oof = np.zeros(len(y))
    oof_thr = np.zeros(len(y))  # per-trial threshold chosen inside its training fold
    ps = {k: [] for k in ("te", "sh")}
    thr_used, chosen = [], []
    for tr, te in GroupKFold(5).split(F[extra], y, groups):
        prm = SHIPPED if params == "shipped" else tune(tr, extra, syn_mode, aug)
        chosen.append(prm)
        Xtr, ytr = train_rows(tr, extra, syn_mode, aug)
        out = fit_predict(prm, Xtr, ytr, [F[extra][te], SF["te"][extra], SF["sh"][extra]])
        thr = 0.5
        if calib or cost:
            pin = inner_oof(prm, tr, extra, syn_mode, aug)
            if calib == "isotonic":
                cal = IsotonicRegression(out_of_bounds="clip", y_min=0, y_max=1).fit(pin, y[tr])
                out = [cal.predict(o) for o in out]
                pin = cal.predict(pin)
            elif calib == "platt":
                cal = _SigmoidCalibration().fit(pin, y[tr])
                out = [cal.predict(o) for o in out]
                pin = cal.predict(pin)
            if cost:
                thr = cost_threshold(pin, y[tr])
        thr_used.append(thr)
        oof[te], oof_thr[te] = out[0], thr
        ps["te"].append(out[1])
        ps["sh"].append(out[2])
    pte, psh = np.mean(ps["te"], axis=0), np.mean(ps["sh"], axis=0)
    thr_syn = float(np.mean(thr_used))
    # metrics at the per-fold threshold: shift probabilities so 0.5 is the cut
    shifted = np.where(oof >= oof_thr, 0.5 + 0.5 * oof, 0.5 * oof)
    um = bootstrap(y, shifted if cost else oof)
    um["auroc"] = bootstrap(y, oof)["auroc"]
    um["brier"] = {"value": float(brier_score_loss(y, oof))}
    pred = oof >= oof_thr
    fp_acts = {a: float(np.mean(pred[(acts == a) & (y == 0)])) for a in sorted(set(acts[y == 0]))}
    r = {
        "name": name, "extra": extra, "syn": syn_mode, "aug": list(aug), "params": chosen, "calib": calib,
        "thresholds": thr_used, "umafall": um,
        "tp": int((pred & (y == 1)).sum()), "fp": int((pred & (y == 0)).sum()), "fn": int((~pred & (y == 1)).sum()),
        "fp_by_adl": fp_acts,
        "syn_test": flag_rates(pte, S_TE[2], thr_syn), "syn_test_auroc": metrics(S_TE[1], pte)["auroc"],
        "syn_shift_bag_drop": flag_rates(psh, S_SH[2], thr_syn)["bag_drop"],
        "syn_shift_crash": flag_rates(psh, S_SH[2], thr_syn)["crash"],
        "_oof": oof.tolist(), "_pred": pred.astype(int).tolist(),
    }
    print(f"{name:34s} R {um['recall']['value']:.3f} P {um['precision']['value']:.3f} F1 {um['f1']['value']:.3f} "
          f"AUC {um['auroc']['value']:.3f} Brier {um['brier']['value']:.3f} | bag {r['syn_test']['bag_drop']:.2f} "
          f"set {r['syn_test']['set_down']:.2f} crash {r['syn_test']['crash']:.2f} | shift bag {r['syn_shift_bag_drop']:.2f} "
          f"thr {np.round(thr_used, 2).tolist()} ({time.time() - t:.0f}s)", flush=True)
    return r


def paired_delta(a, b, n=1000, seed=0):
    """Bootstrap CI for F1 and recall of variant b minus variant a, same trials."""
    rng = np.random.default_rng(seed)
    pa, pb = np.array(a["_pred"]), np.array(b["_pred"])
    out = {"f1": [], "recall": [], "fp": []}

    def f1r(p, yy):
        tp = np.sum(p & (yy == 1)); fp = np.sum(p & (yy == 0)); fn = np.sum(~p.astype(bool) & (yy == 1))
        return 2 * tp / max(1, 2 * tp + fp + fn), tp / max(1, tp + fn), fp

    for _ in range(n):
        i = rng.integers(0, len(y), len(y))
        fa, ra, xa = f1r(pa[i], y[i]); fb, rb, xb = f1r(pb[i], y[i])
        out["f1"].append(fb - fa); out["recall"].append(rb - ra); out["fp"].append(xb - xa)
    return {k: [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))] for k, v in out.items()}


if __name__ == "__main__":
    R = []
    R.append(run("baseline (train.py evaluation, UMAFall only)"))
    R.append(run("+ extra features", extra=True))
    R.append(run("+ waist and chest windows", aug=("waist", "chest")))
    R.append(run("tuned (nested random search)", params="tune"))
    R.append(run("platt calibration", calib="platt"))
    R.append(run("isotonic calibration", calib="isotonic"))
    R.append(run("cost threshold 10:1", cost=True))
    R.append(run("+ synthetic hard negatives", syn_mode="hard"))
    R.append(run("+ synthetic all scenarios", syn_mode="all"))
    R.append(run("+ synthetic all + extra features", syn_mode="all", extra=True))
    R.append(run("+ synthetic all + cost threshold", syn_mode="all", cost=True))
    R.append(run("+ synthetic all + extra + cost", syn_mode="all", extra=True, cost=True))
    R.append(run("+ synthetic all + tuned + cost", syn_mode="all", params="tune", cost=True))

    for r in R[1:]:
        r["delta_vs_baseline"] = paired_delta(R[0], r)

    (HERE / "results.json").write_text(json.dumps({"cost_fn": COST_FN, "cost_fp": COST_FP, "extra_features": EXTRA_NAMES,
                                                   "runs": [{k: v for k, v in r.items() if not k.startswith("_")} for r in R]}, indent=1))

    def ci(m):
        return f"{m['value']:.3f} [{m['lo']:.3f}, {m['hi']:.3f}]"

    L = ["| Variant | Precision | Recall | F1 | AUROC | Brier | FP | FN | bag_drop | set_down | crash (syn) | bag_drop shifted |",
         "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in R:
        u, s = r["umafall"], r["syn_test"]
        L.append(f"| {r['name']} | {ci(u['precision'])} | {ci(u['recall'])} | {ci(u['f1'])} | {ci(u['auroc'])} | {u['brier']['value']:.3f} | "
                 f"{r['fp']} | {r['fn']} | {s['bag_drop']:.2f} | {s['set_down']:.2f} | {s['crash']:.2f} | {r['syn_shift_bag_drop']:.2f} |")
    L += ["", "| Variant | delta F1 95% CI | delta recall 95% CI | delta FP 95% CI | thresholds | MakingACall FP rate |", "|---|---|---|---|---|---|"]
    for r in R[1:]:
        d = r["delta_vs_baseline"]
        L.append(f"| {r['name']} | [{d['f1'][0]:+.3f}, {d['f1'][1]:+.3f}] | [{d['recall'][0]:+.3f}, {d['recall'][1]:+.3f}] | "
                 f"[{d['fp'][0]:+.0f}, {d['fp'][1]:+.0f}] | {', '.join(f'{t:.2f}' for t in r['thresholds'])} | {r['fp_by_adl'].get('MakingACall', 0):.2f} |")
    L += ["", "Tuned parameters per fold:"]
    for r in R:
        if r["params"][0] != SHIPPED:
            L.append(f"- {r['name']}: " + "; ".join(json.dumps(p) for p in r["params"]))
    (HERE / "results_tables.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))
    print(f"total {time.time() - t0:.0f}s")
