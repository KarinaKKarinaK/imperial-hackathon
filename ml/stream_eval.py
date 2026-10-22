"""False alarms per hour of continuous use. Run from ml/: python3 stream_eval.py

train.py scores one 6 s window per trial, cut around the biggest peak. The app
does something else: the phone posts the last 6 s every 1.5 s, the server opens
at most one event per rider per 60 s, and the rider then has 30 s to cancel.
This script replays that loop.

1. UMAFall. 5-fold GroupKFold by subject, each fold trained exactly as
   train.py trains (UMAFall peak windows of the training subjects plus the
   synthetic set, seed 7, same gradient boosting settings). Every FULL phone
   recording of the held-out subjects is streamed with a 6 s window and a
   1.5 s hop. Every alarm on an ADL recording is false. A fall is caught when
   an alarm window contains the true peak; other alarms on fall recordings
   are false.
2. Synthetic ride. Per fold, 2 hours of continuous riding from synthetic.py
   with events dropped in at the rates in RATES_PER_HOUR, fresh seeds
   (2026 + fold). Our own generator, not real riding.

Both at threshold 0.5 (shipped) and 0.2.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from scipy.stats import chi2
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import GroupKFold

from data_umafall import load_all
from features import features, resultant, window_around_peak
from synthetic import RATE, _base, dataset, scenario

ML = Path(__file__).resolve().parent
WIN_S, HOP_S, REFRACTORY_S = 6.0, 1.5, 60.0
THRESHOLDS = [0.5, 0.2]
RIDE_HOURS = 2.0
RIDE_SEED = 2026
# Events per hour of shift on the synthetic ride. Our assumptions for a city
# delivery rider, not measured.
RATES_PER_HOUR = {"pothole": 20, "braking": 12, "set_down": 4, "bag_drop": 1}
CRASHES_PER_RUN = 5


def gbm():
    return HistGradientBoostingClassifier(max_depth=3, learning_rate=0.08, max_iter=200, class_weight="balanced", random_state=0)


def stream_probs(sig: np.ndarray, model) -> tuple[np.ndarray, np.ndarray]:
    """Window end times and crash probabilities, as the phone would post them.
    Like the app, skip windows with under 10 samples or under 0.5 s span."""
    t = sig[:, 0]
    ends, feats = [], []
    te = HOP_S
    while te <= t[-1] + 1e-9:
        lo, hi = np.searchsorted(t, te - WIN_S, side="right"), np.searchsorted(t, te, side="right")
        w = sig[lo:hi]
        if len(w) >= 10 and w[-1, 0] - w[0, 0] >= 0.5:
            ends.append(te)
            feats.append(features(w))
        te += HOP_S
    if not feats:
        return np.array([]), np.array([])
    return np.array(ends), model.predict_proba(np.array(feats))[:, 1]


def alarms(ends: np.ndarray, p: np.ndarray, thr: float) -> list[float]:
    """Server rule: an event only if none in the last 60 s."""
    out: list[float] = []
    for te, pi in zip(ends, p):
        if pi >= thr and (not out or te - out[-1] >= REFRACTORY_S):
            out.append(float(te))
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


# ---------- main ----------
def main():
    trials = [t for t in load_all(ML / "data/umafall") if "phone" in t.signals]
    sigs = [t.signals["phone"][np.argsort(t.signals["phone"][:, 0])] for t in trials]
    X = np.array([features(window_around_peak(s)) for s in sigs])
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

    streams = [None] * len(trials)  # (ends, p) per recording, from the fold that held it out
    rides = []
    for fold, (tr, te) in enumerate(GroupKFold(5).split(X, y, G)):
        model = gbm().fit(np.vstack([X[tr], Xs]), np.concatenate([y[tr], ys]))
        for i in te:
            streams[i] = stream_probs(sigs[i], model)
        ride, events = build_ride(RIDE_SEED + fold)
        ends, p = stream_probs(ride, model)
        rides.append((ends, p, events))
        print(f"fold {fold + 1}/5 done, held-out subjects {sorted(set(G[te]))}")

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

    counts = {}
    for _, _, events in rides:
        for k_, _ in events:
            counts[k_] = counts.get(k_, 0) + 1
    print(f"\nsynthetic events placed over {RIDE_HOURS * 5:.0f} h: {counts}")


if __name__ == "__main__":
    main()
