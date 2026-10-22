"""False alarms per hour of continuous use. Run from ml/: python3 stream_eval.py

train.py scores one 6 s window per trial, cut around the biggest peak. The app
does something else: the phone posts the last 6 s every 1.5 s, the server opens
at most one event per rider per 60 s, and the rider then has 30 s to cancel.
This script replays that loop.

1. UMAFall. 5-fold GroupKFold by subject, each fold trained exactly as
   train.py trains (UMAFall peak windows of the training subjects plus the
   synthetic set, seed 7, same gradient boosting settings, plus hard negative
   mining over the training subjects' daily activity recordings only). Every FULL phone
   recording of the held-out subjects is streamed with a 6 s window and a
   1.5 s hop. Every alarm on an ADL recording is false. A fall is caught when
   an alarm window contains the true peak; other alarms on fall recordings
   are false.
2. Synthetic ride. Per fold, 2 hours of continuous riding from synthetic.py
   with events dropped in at the rates in RATES_PER_HOUR, fresh seeds
   (2026 + fold). Our own generator, not real riding.

3. Confirmation rules the app could add on top, at threshold 0.5.
4. Field data. If ml/data/field/*.json exist, the shipped model (out/model.json)
   is streamed over every ride segment and scored on every labelled event.

Both at threshold 0.5 (shipped) and 0.2. --mine-rounds 0 gives the unmined model.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from scipy.stats import chi2
from sklearn.model_selection import GroupKFold

from data_umafall import load_all
from features import FEATURE_NAMES, features, resultant, window_around_peak
from mining import HOP_S, MINE_ROUNDS, WIN_S, fit_mined, stream_windows
from synthetic import RATE, _base, dataset, scenario

ML = Path(__file__).resolve().parent
REFRACTORY_S = 60.0
STILL = FEATURE_NAMES.index("still_s")
THRESHOLDS = [0.5, 0.2]
RIDE_HOURS = 2.0
RIDE_SEED = 2026
# Events per hour of shift on the synthetic ride. Our assumptions for a city
# delivery rider, not measured.
RATES_PER_HOUR = {"pothole": 20, "braking": 12, "set_down": 4, "bag_drop": 1}
CRASHES_PER_RUN = 5


def alarms(ends: np.ndarray, p: np.ndarray, thr: float) -> list[float]:
    """Server rule: an event only if none in the last 60 s."""
    out: list[float] = []
    for te, pi in zip(ends, p):
        if pi >= thr and (not out or te - out[-1] >= REFRACTORY_S):
            out.append(float(te))
    return out


def confirmed_alarms(ends, p, still, thr: float, rule) -> list[tuple[float, float]]:
    """Alarms under a confirmation rule, as (alarm_time, trigger_time). A window
    at or above thr triggers; the alarm fires on the window that confirms it.
    rule None: fire at once. ("n", N, M): N positive windows among the trigger
    and the next M - 1. ("still", K, S): a window among the trigger and the
    next K has still_s >= S. The 60 s hold runs from the alarm."""
    out, last, k, n = [], -1e9, 0, len(ends)
    while k < n:
        fire = None
        if p[k] >= thr and ends[k] - last >= REFRACTORY_S:
            span = rule[2] - 1 if rule and rule[0] == "n" else (rule[1] if rule else 0)
            cnt = 0
            for j in range(k, n):
                if ends[j] - ends[k] > span * HOP_S + 1e-6:
                    break
                if rule is None or (rule[0] == "still" and still[j] >= rule[2]):
                    fire = j
                    break
                if rule[0] == "n":
                    cnt += p[j] >= thr
                    if cnt >= rule[1]:
                        fire = j
                        break
        if fire is None:
            k += 1
            continue
        out.append((float(ends[fire]), float(ends[k])))
        last = ends[fire]
        k = fire + 1
    return out


def poisson_ci(k: int, hours: float) -> tuple[float, float]:
    lo = chi2.ppf(0.025, 2 * k) / 2 if k > 0 else 0.0
    hi = chi2.ppf(0.975, 2 * k + 2) / 2
    return lo / hours, hi / hours


def wilson(k: int, n: int) -> tuple[float, float]:
    if n == 0:
        return float("nan"), float("nan")
    z, ph = 1.96, k / n
    c = (ph + z * z / (2 * n)) / (1 + z * z / n)
    h = z * np.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return c - h, c + h


# ---------- synthetic ride ----------
def _hold_and_resume(s: np.ndarray, i: int, hold: int, rng) -> None:
    """After a still-ending event, keep the phone still for `hold` samples, then
    swing gravity back to riding over 1 s. A real pickup has its own motion;
    this does not model it."""
    n = len(s)
    g = s[max(0, i - 20):i, 1:4].mean(axis=0)
    g = g / (np.linalg.norm(g) or 1.0)
    j = min(n, i + hold)
    s[i:j, 1:4] = g + rng.normal(0, 0.012, (j - i, 3))
    k = min(n, j + int(RATE))
    for m in range(j, k):
        a = (m - j) / RATE
        v = (1 - a) * g + a * np.array([0.0, 0.0, 1.0])
        v = v / np.linalg.norm(v)
        s[m, 1:4] = v + a * (s[m, 1:4] - np.array([0.0, 0.0, 1.0])) + (1 - a) * rng.normal(0, 0.012, 3)


def build_ride(seed: int):
    """Continuous [t, ax, ay, az] at 100 Hz plus a list of (kind, impact_time)."""
    rng = np.random.default_rng(seed)
    dur = RIDE_HOURS * 3600
    s = _base(rng, int(dur * RATE))
    cands = []
    for kind, rate in RATES_PER_HOUR.items():
        for tt in np.sort(rng.uniform(30, dur - 200, rng.poisson(rate * RIDE_HOURS))):
            cands.append((float(tt), kind))
    crash_times = np.linspace(0, dur, CRASHES_PER_RUN + 2)[1:-1] + rng.uniform(-300, 300, CRASHES_PER_RUN)
    cands += [(float(tt), "crash") for tt in crash_times]
    cands.sort()
    hold_s = {"set_down": (30, 180), "bag_drop": (20, 120), "crash": (90, 180)}
    events, free_at = [], 0.0
    for tt, kind in cands:
        if tt < free_at and kind != "crash":
            continue  # overlaps the previous event, drop it
        if tt < free_at:
            tt = free_at + 5.0  # keep every crash, nudge it past the overlap
        seg = scenario(kind, rng)
        i0 = int(tt * RATE)
        seg_n = len(seg)
        r = resultant(seg)
        impact = tt + float(seg[int(np.argmax(r)), 0])
        s[i0:i0 + seg_n, 1:4] = seg[:, 1:4]
        end = tt + seg_n / RATE
        if kind in hold_s:
            hold = rng.uniform(*hold_s[kind])
            _hold_and_resume(s, i0 + seg_n, int(hold * RATE), rng)
            end += hold + 1.0
        events.append((kind, impact))
        free_at = end + 2.0
    return s, events


# ---------- shipped model and field data ----------
class ShippedModel:
    """The exported gradient boosting trees from out/model.json, evaluated the
    way web/src/lib/model.ts does."""

    def __init__(self, path: Path):
        m = json.loads(path.read_text())
        self.thr = float(m["threshold"])
        self.base = float(m["gbm"]["baseline"])
        self.trees = m["gbm"]["trees"]

    def predict_proba(self, F: np.ndarray) -> np.ndarray:
        out = np.empty(len(F))
        for r, x in enumerate(F):
            z = self.base
            for tree in self.trees:
                n = tree[0]
                while not n["leaf"]:
                    n = tree[n["l"] if x[n["f"]] <= n["t"] else n["r"]]
                z += n["v"]
            out[r] = 1.0 / (1.0 + np.exp(-z))
        return np.column_stack([1 - out, out])


def field_report(folder: Path = ML / "data/field") -> None:
    """Real recordings from the app, one JSON per segment:
    {"id", "kind": "ride"|"event", "label": "riding"|"crash"|"false_alarm"|"real_fall"|"unsure",
     "source": "phone"|"helmet", "durationS", "samples": [[t_s, ax_g, ay_g, az_g], ...]}.
    Never trained on."""
    print("\n===== field data =====")
    files = sorted(folder.glob("*.json")) if folder.exists() else []
    if not files:
        print("no field data yet")
        return
    model = ShippedModel(ML / "out/model.json")
    ride_s, ride_alarms, events, skipped = 0.0, [], [], 0
    for f in files:
        try:
            d = json.loads(f.read_text())
            sig = np.asarray(d["samples"], dtype=float).reshape(-1, 4)
        except (ValueError, KeyError, TypeError) as e:
            print(f"  skipped {f.name}: {e}")
            skipped += 1
            continue
        if len(sig) < 10:
            skipped += 1
            continue
        sig = sig[np.argsort(sig[:, 0])]
        ends, F = stream_windows(sig)
        p = model.predict_proba(F)[:, 1] if len(F) else np.array([])
        n_al = len(alarms(ends, p, model.thr))
        if d.get("kind") == "ride":
            ride_s += float(d.get("durationS") or sig[-1, 0] - sig[0, 0])
            ride_alarms.append((d.get("id", f.stem), d.get("source"), n_al))
        elif d.get("kind") == "event":
            pk = float(model.predict_proba(features(window_around_peak(sig))[None])[0, 1])
            events.append((d.get("id", f.stem), d.get("label"), d.get("source"), pk, n_al))
    if ride_s > 0:
        k = sum(a for _, _, a in ride_alarms)
        lo, hi = poisson_ci(k, ride_s / 3600)
        print(f"rides: {len(ride_alarms)} segments, {ride_s / 3600:.2f} h, {k} alarms = {k / (ride_s / 3600):.2f} false alarms per riding hour, Poisson 95% [{lo:.2f}, {hi:.2f}]")
        print("  by source:", {s_: sum(a for _, src, a in ride_alarms if src == s_) for s_ in sorted({str(src) for _, src, _ in ride_alarms})})
    else:
        print("rides: none")
    if events:
        pos, neg = {"crash", "real_fall"}, {"false_alarm", "riding"}
        for lab in sorted({str(e[1]) for e in events}):
            ev = [e for e in events if str(e[1]) == lab]
            flagged = sum(1 for e in ev if e[3] >= model.thr)
            print(f"  events labelled {lab}: {len(ev)}, peak window flagged {flagged}, any streaming alarm {sum(1 for e in ev if e[4])}")
        yy = np.array([1 if e[1] in pos else 0 for e in events if e[1] in pos | neg])
        pp = np.array([e[3] for e in events if e[1] in pos | neg])
        if len(yy):
            tp = int(((pp >= model.thr) & (yy == 1)).sum()); fp = int(((pp >= model.thr) & (yy == 0)).sum())
            print(f"  scored events (unsure left out): {len(yy)}, {int(yy.sum())} real, recall {tp}/{int(yy.sum())}, false positives {fp}/{int((yy == 0).sum())}")
    if skipped:
        print(f"  {skipped} files skipped")


# ---------- main ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mine-rounds", type=int, default=MINE_ROUNDS, help="hard negative mining rounds, 0 for the unmined model")
    args = ap.parse_args()
    trials = [t for t in load_all(ML / "data/umafall") if "phone" in t.signals]
    sigs = [t.signals["phone"][np.argsort(t.signals["phone"][:, 0])] for t in trials]
    raw = [t.signals["phone"] for t in trials]  # unsorted, exactly as train.py sees them, so fold models match train.py
    X = np.array([features(window_around_peak(s)) for s in raw])
    y = np.array([t.label for t in trials])
    G = np.array([t.subject for t in trials])
    acts = np.array([t.activity for t in trials])
    Xs_w, ys, _ = dataset(n_per=150)  # seed 7, as train.py
    Xs = np.array([features(w) for w in Xs_w])
    dur = np.array([s[-1, 0] - s[0, 0] for s in sigs])
    peak_t = np.array([s[int(np.argmax(resultant(s))), 0] for s in sigs])
    print(f"UMAFall phone: {len(trials)} recordings, {y.sum()} falls, {len(set(G))} subjects")
    print(f"recording length: median {np.median(dur):.1f} s, min {dur.min():.1f}, max {dur.max():.1f}")
    print(f"ADL time {dur[y == 0].sum() / 3600:.3f} h, fall recording time {dur[y == 1].sum() / 3600:.3f} h")

    win = [stream_windows(s) for s in raw]  # (ends, features) per recording
    streams = [None] * len(trials)  # (ends, p) per recording, from the fold that held it out
    stills = [w[1][:, STILL] for w in win]
    rides, ride_stills = [], []
    for fold, (tr, te) in enumerate(GroupKFold(5).split(X, y, G)):
        negs = np.vstack([win[i][1] for i in tr if y[i] == 0])  # training subjects only
        model, n_mined = fit_mined(np.vstack([X[tr], Xs]), np.concatenate([y[tr], ys]), negs, rounds=args.mine_rounds)
        for i in te:
            ends, F = win[i]
            streams[i] = (ends, model.predict_proba(F)[:, 1] if len(F) else np.array([]))
        ride, events = build_ride(RIDE_SEED + fold)
        ends, F = stream_windows(ride)
        rides.append((ends, model.predict_proba(F)[:, 1], events))
        ride_stills.append(F[:, STILL])
        print(f"fold {fold + 1}/5 done, held-out subjects {sorted(set(G[te]))}, mined {n_mined} hard negatives from training subjects")

    print(f"\nwindows scored: UMAFall {sum(len(e) for e, _ in streams)}, synthetic ride {sum(len(e) for e, _, _ in rides)}")
    subs = np.unique(G)
    rng = np.random.default_rng(0)
    for thr in THRESHOLDS:
        print(f"\n===== threshold {thr} =====")
        # UMAFall ADL
        fa = np.array([len(alarms(*streams[i], thr)) if y[i] == 0 else 0 for i in range(len(y))])
        adl = y == 0
        k, h = int(fa[adl].sum()), dur[adl].sum() / 3600
        lo, hi = poisson_ci(k, h)
        boot = []
        for _ in range(2000):
            b = rng.choice(subs, len(subs))
            idx = np.concatenate([np.where((G == s_) & adl)[0] for s_ in b])
            boot.append(fa[idx].sum() / (dur[idx].sum() / 3600))
        print(f"UMAFall ADL: {k} false alarms in {h:.3f} h = {k / h:.1f} per hour, Poisson 95% [{lo:.1f}, {hi:.1f}], subject bootstrap [{np.percentile(boot, 2.5):.1f}, {np.percentile(boot, 97.5):.1f}]")
        print(f"  ADL recordings with at least one alarm: {(fa[adl] > 0).sum()} of {adl.sum()}")
        per_act = {a: (int(fa[(acts == a) & adl].sum()), int(((acts == a) & adl).sum())) for a in sorted(set(acts[adl]))}
        print("  alarms by activity (alarms / recordings):", ", ".join(f"{a} {v[0]}/{v[1]}" for a, v in sorted(per_act.items(), key=lambda kv: -kv[1][0])))
        # UMAFall falls
        caught, delays, extra, blocked, early = np.zeros(len(y), bool), [], 0, 0, []
        for i in np.where(y == 1)[0]:
            al = alarms(*streams[i], thr)
            hit = [a for a in al if a - WIN_S < peak_t[i] <= a]
            if hit:
                caught[i] = True
                delays.append(hit[0] - peak_t[i])
            else:
                if al:
                    early.append(al[0] - peak_t[i])
                ends, p = streams[i]
                if any(pi >= thr and te - WIN_S < peak_t[i] <= te for te, pi in zip(ends, p)):
                    blocked += 1  # a window over the peak was flagged but the 60 s rule held it back
            extra += len(al) - len(hit)
        fall = y == 1
        bt = []
        for _ in range(2000):
            b = rng.choice(subs, len(subs))
            idx = np.concatenate([np.where((G == s_) & fall)[0] for s_ in b])
            if len(idx):
                bt.append(caught[idx].mean())
        d = np.array(delays)
        print(f"UMAFall falls, streaming: caught {caught[fall].sum()} of {fall.sum()} = {caught[fall].mean():.3f}, subject bootstrap [{np.percentile(bt, 2.5):.3f}, {np.percentile(bt, 97.5):.3f}]")
        anyal = sum(1 for i in np.where(y == 1)[0] if alarms(*streams[i], thr))
        print(f"  fall recordings with any alarm: {anyal} of {(y == 1).sum()}")
        print(f"  missed falls that had an alarm earlier in the recording, seconds before the peak window: {np.round(early, 2).tolist()}")
        print(f"  missed only because an earlier false alarm started the 60 s hold: {blocked}")
        print(f"  extra (false) alarms on fall recordings: {extra} in {dur[fall].sum() / 3600:.3f} h")
        if len(d):
            print(f"  impact to first alarm: median {np.median(d):.2f} s, p10 {np.percentile(d, 10):.2f}, p90 {np.percentile(d, 90):.2f}, max {d.max():.2f}")
        print("  miss rate by fall type:", {a: round(float(1 - caught[(acts == a) & fall].mean()), 2) for a in sorted(set(acts[fall]))})
        # synthetic ride
        tot_h, false_n, crash_n, crash_hit, cd = 0.0, 0, 0, 0, []
        cause, per_ev = {}, {}
        for ends, p, events in rides:
            tot_h += RIDE_HOURS
            al = alarms(ends, p, thr)
            crashes = [t for k_, t in events if k_ == "crash"]
            crash_n += len(crashes)
            for ct in crashes:
                h_ = [a for a in al if a - WIN_S < ct <= a]
                if h_:
                    crash_hit += 1
                    cd.append(h_[0] - ct)
            for k_, t in events:
                if k_ == "crash":
                    continue
                n_, f_ = per_ev.get(k_, (0, 0))
                per_ev[k_] = (n_ + 1, f_ + int(any(a - WIN_S < t <= a for a in al)))
            for a in al:
                if any(a - WIN_S < ct <= a for ct in crashes):
                    continue
                false_n += 1
                inside = [k_ for k_, t in events if a - WIN_S < t <= a]
                c = inside[0] if inside else "riding only"
                cause[c] = cause.get(c, 0) + 1
        lo, hi = poisson_ci(false_n, tot_h)
        clo, chi_ = wilson(crash_hit, crash_n)
        print(f"Synthetic ride: {false_n} false alarms in {tot_h:.0f} h = {false_n / tot_h:.2f} per hour, Poisson 95% [{lo:.2f}, {hi:.2f}]")
        print(f"  false alarms by event in the window: {cause}")
        print("  events that fell inside an alarm window (alarms / events):", {k_: f"{v[1]}/{v[0]}" for k_, v in per_ev.items()})
        print(f"  crashes caught {crash_hit} of {crash_n}, Wilson 95% [{clo:.2f}, {chi_:.2f}]" + (f", impact to alarm median {np.median(cd):.2f} s, max {max(cd):.2f}" if cd else ""))

    # confirmation rules on top of the model, threshold 0.5
    print("\n===== confirmation rules, threshold 0.5 =====")
    rules = {"none (shipped)": None, "2 of 2 consecutive": ("n", 2, 2), "2 of next 3": ("n", 2, 3),
             "still_s >= 1 s within 2 hops": ("still", 2, 1.0), "still_s >= 2 s within 2 hops": ("still", 2, 2.0)}
    adl = y == 0
    for name, rule in rules.items():
        fa, caught, d = 0, 0, []
        for i in range(len(y)):
            ends, p = streams[i]
            al = confirmed_alarms(ends, p, stills[i], 0.5, rule)
            if y[i] == 0:
                fa += len(al)
            else:
                hit = [a for a, tg in al if tg - WIN_S < peak_t[i] <= tg]
                if hit:
                    caught += 1
                    d.append(hit[0] - peak_t[i])
        rf, rc, rn, rd = 0, 0, 0, []
        for (ends, p, events), st in zip(rides, ride_stills):
            al = confirmed_alarms(ends, p, st, 0.5, rule)
            crashes = [t for k_, t in events if k_ == "crash"]
            rn += len(crashes)
            for ct in crashes:
                h_ = [a for a, tg in al if tg - WIN_S < ct <= tg]
                if h_:
                    rc += 1
                    rd.append(h_[0] - ct)
            rf += sum(1 for a, tg in al if not any(tg - WIN_S < ct <= tg for ct in crashes))
        h = dur[adl].sum() / 3600
        lo, hi = poisson_ci(fa, h)
        rlo, rhi = poisson_ci(rf, RIDE_HOURS * len(rides))
        d = np.array(d)
        print(f"{name}: UMAFall ADL {fa / h:.1f} per hour [{lo:.1f}, {hi:.1f}], falls {caught} of {int(y.sum())}, impact to alarm median {np.median(d):.2f} s, p90 {np.percentile(d, 90):.2f}, max {d.max():.2f}; "
              f"ride {rf / (RIDE_HOURS * len(rides)):.2f} per hour [{rlo:.2f}, {rhi:.2f}], crashes {rc} of {rn}" + (f", crash to alarm max {max(rd):.2f} s" if rd else ""))

    field_report()

    counts = {}
    for _, _, events in rides:
        for k_, _ in events:
            counts[k_] = counts.get(k_, 0) + 1
    print(f"\nsynthetic events placed over {RIDE_HOURS * 5:.0f} h: {counts}")


if __name__ == "__main__":
    main()
