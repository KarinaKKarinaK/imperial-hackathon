"""Train and evaluate crash detectors, then export the deployable one.

Usage: python train.py [--data data/umafall] [--out out]

Models
  rule      the original three-threshold rule (baseline)
  logreg    logistic regression on ten window features (scikit-learn)
  gbm       histogram gradient boosting on the same features (scikit-learn)
  mlp       10-16-1 network on the same features (PyTorch), exportable to JSON
  cnn       1D convolutional network on the raw resampled window (PyTorch)

Evaluation
  Leave-subjects-out: 5-fold GroupKFold on UMAFall subjects, phone sensor.
  Metrics: precision, recall, F1, AUROC, Brier. 95% CIs by bootstrap over trials.
  Domain shift: every model is also scored on the synthetic rider set, which it
  never trains on.

Export
  out/model.json          scaler plus MLP weights (or logreg if it wins)
  out/results.json, .md   the tables
  out/parity.json         raw windows with features and probabilities, for the
                          TypeScript port to check itself against
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import GroupKFold
from sklearn.preprocessing import StandardScaler

from data_umafall import load_all
from features import FEATURE_NAMES, RATE_HZ, WINDOW_S, features, resample, rule_detector, window_around_peak
from synthetic import dataset as synthetic_dataset

torch.manual_seed(0)
np.random.seed(0)

THRESHOLD = 0.5


# ---------- models ----------
class MLP(torch.nn.Module):
    def __init__(self, d: int):
        super().__init__()
        self.net = torch.nn.Sequential(torch.nn.Linear(d, 16), torch.nn.ReLU(), torch.nn.Linear(16, 1))

    def forward(self, x):
        return self.net(x).squeeze(-1)


class CNN(torch.nn.Module):
    def __init__(self, ch: int = 4):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Conv1d(ch, 16, 7, padding=3), torch.nn.ReLU(), torch.nn.MaxPool1d(3),
            torch.nn.Conv1d(16, 32, 5, padding=2), torch.nn.ReLU(), torch.nn.MaxPool1d(3),
            torch.nn.Conv1d(32, 32, 3, padding=1), torch.nn.ReLU(), torch.nn.AdaptiveMaxPool1d(1),
            torch.nn.Flatten(), torch.nn.Linear(32, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)


def fit_torch(model, X, y, epochs=200, lr=1e-2, wd=1e-4):
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=wd)
    Xt = torch.tensor(X, dtype=torch.float32)
    yt = torch.tensor(y, dtype=torch.float32)
    pos = max(1.0, float((yt == 0).sum() / max(1.0, (yt == 1).sum())))
    loss_fn = torch.nn.BCEWithLogitsLoss(pos_weight=torch.tensor(pos))
    model.train()
    for _ in range(epochs):
        opt.zero_grad()
        loss = loss_fn(model(Xt), yt)
        loss.backward()
        opt.step()
    model.eval()
    return model


def predict_torch(model, X):
    with torch.no_grad():
        return torch.sigmoid(model(torch.tensor(X, dtype=torch.float32))).numpy()


def raw_tensor(windows: list[np.ndarray]) -> np.ndarray:
    """Resample each window to a fixed length, channels = ax, ay, az, resultant."""
    n = int(WINDOW_S * RATE_HZ)
    out = np.zeros((len(windows), 4, n), dtype=np.float32)
    for i, w in enumerate(windows):
        s = resample(w, RATE_HZ)
        m = min(n, len(s))
        out[i, 0:3, :m] = s[:m, 1:4].T
        out[i, 3, :m] = np.sqrt((s[:m, 1:4] ** 2).sum(axis=1))
    return out


# ---------- metrics ----------
def metrics(y, p, thr=THRESHOLD):
    pred = (p >= thr).astype(int)
    pr, rc, f1, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
    auc = roc_auc_score(y, p) if len(np.unique(y)) > 1 else float("nan")
    return {"precision": pr, "recall": rc, "f1": f1, "auroc": auc, "brier": brier_score_loss(y, np.clip(p, 0, 1))}


def bootstrap(y, p, n=1000, seed=0):
    rng = np.random.default_rng(seed)
    keys = ["precision", "recall", "f1", "auroc", "brier"]
    acc = {k: [] for k in keys}
    idx = np.arange(len(y))
    for _ in range(n):
        b = rng.choice(idx, len(idx), replace=True)
        if len(np.unique(y[b])) < 2:
            continue
        m = metrics(y[b], p[b])
        for k in keys:
            acc[k].append(m[k])
    point = metrics(y, p)
    return {k: {"value": float(point[k]), "lo": float(np.nanpercentile(acc[k], 2.5)), "hi": float(np.nanpercentile(acc[k], 97.5))} for k in keys}


# ---------- main ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/umafall")
    ap.add_argument("--out", default="out")
    ap.add_argument("--sensor", default="phone")
    ap.add_argument("--folds", type=int, default=5)
    ap.add_argument("--extra", default="../validation", help="folder of drop test CSVs named SET_condition_rep.csv")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    trials = [t for t in load_all(Path(args.data)) if args.sensor in t.signals]
    windows = [window_around_peak(t.signals[args.sensor]) for t in trials]
    X = np.array([features(w) for w in windows])
    y = np.array([t.label for t in trials])
    groups = np.array([t.subject for t in trials])
    acts = np.array([t.activity for t in trials])
    print(f"UMAFall {args.sensor}: {len(trials)} trials, {y.sum()} falls, {len(set(groups))} subjects")

    Xs_w, ys, s_names = synthetic_dataset(n_per=150)
    Xs = np.array([features(w) for w in Xs_w])
    print(f"synthetic: {len(ys)} windows, {ys.sum()} crashes")

    oof = {m: np.zeros(len(y)) for m in ["rule", "logreg", "gbm", "mlp", "cnn"]}
    syn = {m: [] for m in oof}
    gkf = GroupKFold(n_splits=args.folds)
    raw = raw_tensor(windows)
    raw_s = raw_tensor(Xs_w)

    for fold, (tr, te) in enumerate(gkf.split(X, y, groups)):
        sc = StandardScaler().fit(X[tr])
        Xtr, Xte = sc.transform(X[tr]), sc.transform(X[te])

        oof["rule"][te] = [rule_detector(f)[1] for f in X[te]]
        syn["rule"].append([rule_detector(f)[1] for f in Xs])

        lr = LogisticRegression(C=1.0, class_weight="balanced", max_iter=2000).fit(Xtr, y[tr])
        oof["logreg"][te] = lr.predict_proba(Xte)[:, 1]
        syn["logreg"].append(lr.predict_proba(sc.transform(Xs))[:, 1])

        gbm = HistGradientBoostingClassifier(max_depth=3, learning_rate=0.08, max_iter=200, class_weight="balanced", random_state=0).fit(X[tr], y[tr])
        oof["gbm"][te] = gbm.predict_proba(X[te])[:, 1]
        syn["gbm"].append(gbm.predict_proba(Xs)[:, 1])

        mlp = fit_torch(MLP(X.shape[1]), Xtr, y[tr])
        oof["mlp"][te] = predict_torch(mlp, Xte)
        syn["mlp"].append(predict_torch(mlp, sc.transform(Xs)))

        # raw-window CNN, per-channel standardisation from the training fold
        mu = raw[tr].mean(axis=(0, 2), keepdims=True)
        sd = raw[tr].std(axis=(0, 2), keepdims=True) + 1e-6
        cnn = fit_torch(CNN(), (raw[tr] - mu) / sd, y[tr], epochs=120, lr=3e-3)
        oof["cnn"][te] = predict_torch(cnn, (raw[te] - mu) / sd)
        syn["cnn"].append(predict_torch(cnn, (raw_s - mu) / sd))
        print(f"fold {fold + 1}/{args.folds} done")

    results = {"n_trials": int(len(y)), "n_falls": int(y.sum()), "n_subjects": int(len(set(groups))), "sensor": args.sensor, "threshold": THRESHOLD, "models": {}}
    for m in oof:
        results["models"][m] = {
            "umafall": bootstrap(y, oof[m]),
            "synthetic": metrics(ys, np.mean(syn[m], axis=0)),
            "synthetic_by_scenario": {},
        }
        ps = np.mean(syn[m], axis=0)
        for name in sorted(set(s_names)):
            idx = np.array([i for i, s in enumerate(s_names) if s == name])
            results["models"][m]["synthetic_by_scenario"][name] = float(np.mean(ps[idx] >= THRESHOLD))

    # helmet drop tests, if the rig has produced any. Evaluated only, never
    # trained on, so the helmet column is a true held-out measurement.
    helmet = load_drop_tests(Path(args.extra))
    if helmet:
        Xh = np.array([features(w) for w, _, _ in helmet])
        yh = np.array([lab for _, lab, _ in helmet])
        sets = np.array([st for _, _, st in helmet])
        sc_h = StandardScaler().fit(X)
        gbm_h = HistGradientBoostingClassifier(max_depth=3, learning_rate=0.08, max_iter=200, class_weight="balanced", random_state=0).fit(X, y)
        ph = gbm_h.predict_proba(Xh)[:, 1]
        rule_h = np.array([rule_detector(f)[1] for f in Xh])
        results["helmet_drop_tests"] = {
            "n": int(len(yh)), "n_crash": int(yh.sum()),
            "gbm": bootstrap(yh, ph) if len(np.unique(yh)) > 1 else metrics(yh, ph),
            "rule": bootstrap(yh, rule_h) if len(np.unique(yh)) > 1 else metrics(yh, rule_h),
            "by_set": {st: {"n": int((sets == st).sum()), "flagged": float(np.mean(ph[sets == st] >= THRESHOLD)), "label": int(yh[sets == st][0])} for st in sorted(set(sets))},
        }
        del sc_h
        print(f"helmet drop tests: {len(yh)} runs, {yh.sum()} impacts")

    # out-of-fold predictions, so anyone can recompute every number above
    import csv
    with (out / "oof.csv").open("w", newline="") as fh:
        wtr = csv.writer(fh)
        wtr.writerow(["subject", "activity", "label"] + [f"p_{m}" for m in oof])
        for i in range(len(y)):
            wtr.writerow([int(groups[i]), acts[i], int(y[i])] + [f"{oof[m][i]:.4f}" for m in oof])

    # threshold sweep for the deployed model: how precision and recall trade
    sweep = []
    for thr in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
        m = metrics(y, oof["gbm"], thr)
        pred = oof["gbm"] >= thr
        tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
        fn = int(((pred == 0) & (y == 1)).sum()); tn = int(((pred == 0) & (y == 0)).sum())
        sweep.append({"threshold": thr, "precision": m["precision"], "recall": m["recall"], "tp": tp, "fp": fp, "fn": fn, "tn": tn})
    results["threshold_sweep_gbm"] = sweep

    # failure table: which UMAFall activities fool each model
    fails = {}
    for m in oof:
        pred = oof[m] >= THRESHOLD
        fp = {}
        for a in sorted(set(acts[y == 0])):
            idx = (acts == a) & (y == 0)
            fp[a] = float(np.mean(pred[idx]))
        fn = {}
        for a in sorted(set(acts[y == 1])):
            idx = (acts == a) & (y == 1)
            fn[a] = float(1 - np.mean(pred[idx]))
        fails[m] = {"false_positive_rate_by_adl": fp, "miss_rate_by_fall": fn}
    results["failures"] = fails

    # ---------- export: refit the deployable models on everything ----------
    # Gradient boosting is the strongest model and its trees port to a few
    # lines of TypeScript. The MLP is exported as well as a fallback.
    sc = StandardScaler().fit(X)
    Xall_raw = np.vstack([X, Xs])
    Xall = sc.transform(Xall_raw)
    yall = np.concatenate([y, ys])
    export = {"kind": "gbm", "features": FEATURE_NAMES, "rate_hz": RATE_HZ, "window_s": WINDOW_S, "threshold": THRESHOLD,
              "scaler": {"mean": sc.mean_.tolist(), "scale": sc.scale_.tolist()},
              "trained_on": f"UMAFall {args.sensor} ({len(y)} trials, {len(set(groups))} subjects) plus {len(ys)} synthetic rider windows"}
    gbm = HistGradientBoostingClassifier(max_depth=3, learning_rate=0.08, max_iter=200, class_weight="balanced", random_state=0).fit(Xall_raw, yall)
    trees = []
    for stage in gbm._predictors:
        nodes = stage[0].nodes
        trees.append([{"f": int(n["feature_idx"]), "t": float(n["num_threshold"]), "l": int(n["left"]), "r": int(n["right"]),
                       "v": float(n["value"]), "leaf": bool(n["is_leaf"]), "ml": bool(n["missing_go_to_left"])} for n in nodes])
    export["gbm"] = {"baseline": float(np.ravel(gbm._baseline_prediction)[0]), "trees": trees}
    mlp = fit_torch(MLP(X.shape[1]), Xall, yall, epochs=400)
    W1, b1 = mlp.net[0].weight.detach().numpy(), mlp.net[0].bias.detach().numpy()
    W2, b2 = mlp.net[2].weight.detach().numpy(), mlp.net[2].bias.detach().numpy()
    export["mlp"] = {"W1": W1.tolist(), "b1": b1.tolist(), "W2": W2[0].tolist(), "b2": float(b2[0])}
    prob = lambda F: gbm.predict_proba(F)[:, 1]  # noqa: E731
    results["exported"] = "gbm"
    (out / "model.json").write_text(json.dumps(export))

    # parity vectors: a few real and synthetic windows with features and probabilities
    picks = [int(np.argmax(y)), int(np.argmin(y)), 0, len(y) // 2]
    par = []
    for i in picks:
        w = resample(windows[i])
        par.append({"source": f"umafall:{trials[i].activity}", "label": int(y[i]), "samples": np.round(w, 5).tolist(), "features": features(w).tolist(), "p": float(prob(features(w)[None])[0]), "p_mlp": float(predict_torch(mlp, sc.transform(features(w)[None]))[0])})
    for name in ["riding", "pothole", "set_down", "bag_drop", "crash"]:
        i = s_names.index(name)
        w = resample(Xs_w[i])
        par.append({"source": f"synthetic:{name}", "label": int(ys[i]), "samples": np.round(w, 5).tolist(), "features": features(w).tolist(), "p": float(prob(features(w)[None])[0]), "p_mlp": float(predict_torch(mlp, sc.transform(features(w)[None]))[0])})
    (out / "parity.json").write_text(json.dumps(par))

    # demo windows for the website replay buttons
    rng_pick = {}
    for name in ["riding", "braking", "pothole", "set_down", "bag_drop", "crash"]:
        i = s_names.index(name)
        w = resample(Xs_w[i])
        rng_pick[name] = {"samples": np.round(w, 4).tolist(), "label": int(ys[i])}
    (out / "demo_windows.json").write_text(json.dumps(rng_pick))

    (out / "results.json").write_text(json.dumps(results, indent=1))
    (out / "results.md").write_text(render_md(results))
    print(render_md(results))


def load_drop_tests(folder: Path) -> list[tuple[np.ndarray, int, str]]:
    """CSV per run, columns t_ms,ax,ay,az[,gx,gy,gz] with acceleration in g.
    Set letters A to D are impacts (label 1), E to J are controls (label 0),
    per validation/DROP_TEST_PROTOCOL.md."""
    out = []
    if not folder.exists():
        return out
    for p in sorted(folder.glob("*.csv")):
        st = p.name.split("_")[0].upper()
        if st not in "ABCDEFGHIJ" or len(st) != 1:
            continue
        try:
            arr = np.genfromtxt(p, delimiter=",", names=True)
        except Exception:
            continue
        if arr.size < 20:
            continue
        w = np.column_stack([arr["t_ms"] / 1000.0, arr["ax"], arr["ay"], arr["az"]]).astype(float)
        out.append((window_around_peak(w), 1 if st in "ABCD" else 0, st))
    return out


def render_md(r: dict) -> str:
    L = [f"# Crash detector results\n", f"UMAFall, {r['sensor']} sensor, {r['n_trials']} trials ({r['n_falls']} falls), {r['n_subjects']} subjects, 5-fold leave-subjects-out. Threshold {r['threshold']}. 95% bootstrap CIs.\n",
         "| Model | Precision | Recall | F1 | AUROC | Brier |", "|---|---|---|---|---|---|"]
    for m, v in r["models"].items():
        u = v["umafall"]
        f = lambda k: f"{u[k]['value']:.3f} [{u[k]['lo']:.3f}, {u[k]['hi']:.3f}]"  # noqa: E731
        L.append(f"| {m} | {f('precision')} | {f('recall')} | {f('f1')} | {f('auroc')} | {f('brier')} |")
    L += ["\n## Domain shift: synthetic rider set (never trained on)\n", "| Model | Precision | Recall | AUROC | riding | braking | pothole | set_down | bag_drop | crash |", "|---|---|---|---|---|---|---|---|---|---|"]
    for m, v in r["models"].items():
        s = v["synthetic"]
        b = v["synthetic_by_scenario"]
        L.append(f"| {m} | {s['precision']:.3f} | {s['recall']:.3f} | {s['auroc']:.3f} | " + " | ".join(f"{b[k]:.2f}" for k in ["riding", "braking", "pothole", "set_down", "bag_drop", "crash"]) + " |")
    L.append("\nScenario columns show the fraction of windows flagged as a crash. Only the crash column should be high.\n")
    L.append(f"\nExported model: {r['exported']}.\n")
    if "threshold_sweep_gbm" in r:
        L += ["\n## Threshold sweep, gradient boosting (out-of-fold)\n", "| Threshold | Precision | Recall | TP | FP | FN | TN |", "|---|---|---|---|---|---|---|"]
        for t in r["threshold_sweep_gbm"]:
            L.append(f"| {t['threshold']:.1f} | {t['precision']:.3f} | {t['recall']:.3f} | {t['tp']} | {t['fp']} | {t['fn']} | {t['tn']} |")
    if "helmet_drop_tests" in r:
        h = r["helmet_drop_tests"]
        L += [f"\n## Helmet drop tests (held out, {h['n']} runs, {h['n_crash']} impacts)\n", "| Set | Runs | Label | Flagged as crash |", "|---|---|---|---|"]
        for st, v in h["by_set"].items():
            L.append(f"| {st} | {v['n']} | {'impact' if v['label'] else 'control'} | {v['flagged']:.0%} |")
        g = h["gbm"]
        if isinstance(g.get("recall"), dict):
            L.append(f"\nGradient boosting on the helmet: recall {g['recall']['value']:.3f} [{g['recall']['lo']:.3f}, {g['recall']['hi']:.3f}], precision {g['precision']['value']:.3f} [{g['precision']['lo']:.3f}, {g['precision']['hi']:.3f}].\n")
    L.append("\n## Failure table, UMAFall (out-of-fold)\n")
    for m, f in r["failures"].items():
        worst_fp = sorted(f["false_positive_rate_by_adl"].items(), key=lambda kv: -kv[1])[:3]
        worst_fn = sorted(f["miss_rate_by_fall"].items(), key=lambda kv: -kv[1])[:3]
        L.append(f"- {m}: most false alarms from " + ", ".join(f"{a} ({v:.0%})" for a, v in worst_fp) + "; most misses on " + ", ".join(f"{a} ({v:.0%})" for a, v in worst_fn))
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    main()
