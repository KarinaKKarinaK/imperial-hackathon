"""Shared data, extra features and evaluation for the crash detector experiments.

Nothing here changes the shipped pipeline. It imports the loader, the ten
shipped features and the metric helpers from the parent folder and adds:

- a cached UMAFall window set (phone, plus waist and chest for augmentation)
- extra accelerometer-only features (all rotation invariant, all cheap in TS)
- a synthetic generator with a held-out seed and a harder "shifted" variant
"""

from __future__ import annotations

import pickle
import sys
from pathlib import Path

import numpy as np

ML = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ML))

from data_umafall import load_all  # noqa: E402
from features import RATE_HZ, features, resample, resultant, window_around_peak  # noqa: E402
import synthetic as syn  # noqa: E402

CACHE = ML / "data" / "experiments_cache.pkl"


# ---------- data ----------
def umafall(sensors=("phone", "waist", "chest")) -> dict:
    """Windows per sensor for every trial that has the phone. Cached."""
    if CACHE.exists():
        return pickle.loads(CACHE.read_bytes())
    trials = [t for t in load_all(ML / "data" / "umafall") if "phone" in t.signals]
    d = {
        "y": np.array([t.label for t in trials]),
        "groups": np.array([t.subject for t in trials]),
        "acts": np.array([t.activity for t in trials]),
        "win": {s: [window_around_peak(t.signals[s]) if s in t.signals else None for t in trials] for s in sensors},
    }
    CACHE.write_bytes(pickle.dumps(d))
    return d


# ---------- extra features ----------
EXTRA_NAMES = [
    "ff_s",  # longest run with r < 0.6 g in the 1 s before the peak (free fall)
    "settle_s",  # time from peak until r stays within 0.25 g of 1 g for 1 s
    "post1_std",  # resultant std in the first second after the peak (tumble)
    "rot_path_deg",  # total angle travelled by the smoothed gravity direction, peak to +2 s
    "n_peaks_2g",  # separate excursions above 2 g
    "impact_w_s",  # time around the peak with r above half the peak
    "rough_post",  # mean squared first difference over variance, 0 to 2 s after the peak
    "pre_act",  # resultant std from 2.5 s to 1 s before the peak
    "peak2_ratio",  # second highest excursion over the peak
]


def _runs(mask: np.ndarray) -> list[tuple[int, int]]:
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        if not v and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(mask)))
    return out


def extra_features(samples: np.ndarray, rate_hz: float = RATE_HZ) -> np.ndarray:
    s = resample(np.asarray(samples, dtype=float), rate_hz)
    n = len(s)
    if n < 10:
        return np.zeros(len(EXTRA_NAMES))
    dt = 1.0 / rate_hz
    r = resultant(s)
    p = int(np.argmax(r))
    sec = int(rate_hz)

    pre1 = r[max(0, p - sec) : p]
    ff = max([b - a for a, b in _runs(pre1 < 0.6)], default=0) * dt

    calm = np.abs(r - 1.0) < 0.25
    settle = (n - p) * dt
    for i in range(p + 1, n - sec + 1):
        if calm[i : i + sec].all():
            settle = (i - p) * dt
            break

    post1 = r[p + 3 : p + sec]
    post1_std = float(post1.std()) if len(post1) > 1 else 0.0

    k = max(1, int(0.2 * rate_hz))
    ker = np.ones(k) / k
    sm = np.column_stack([np.convolve(s[:, j], ker, mode="same") for j in (1, 2, 3)])
    seg = sm[p : min(n, p + 2 * sec)]
    u = seg / (np.linalg.norm(seg, axis=1, keepdims=True) + 1e-9)
    rot = float(np.degrees(np.arccos(np.clip((u[1:] * u[:-1]).sum(axis=1), -1, 1))).sum()) if len(u) > 1 else 0.0

    exc = _runs(r > 2.0)
    n_peaks = len(exc)
    maxes = sorted([float(r[a:b].max()) for a, b in exc], reverse=True)
    peak2 = (maxes[1] / maxes[0]) if len(maxes) > 1 else 0.0

    half = r > r[p] / 2
    a = p
    while a > 0 and half[a - 1]:
        a -= 1
    b = p
    while b < n - 1 and half[b + 1]:
        b += 1
    impact_w = (b - a + 1) * dt

    post2 = r[p + 3 : p + 2 * sec]
    v = post2.var() if len(post2) > 2 else 0.0
    rough = float(np.mean(np.diff(post2) ** 2) / v) if v > 1e-9 else 0.0

    pre_a = r[max(0, p - int(2.5 * rate_hz)) : max(0, p - sec)]
    pre_act = float(pre_a.std()) if len(pre_a) > 1 else 0.0

    return np.array([ff, settle, post1_std, rot, n_peaks, impact_w, rough, pre_act, peak2])


def feats(windows, extra: bool) -> np.ndarray:
    base = np.array([features(w) for w in windows])
    if not extra:
        return base
    return np.hstack([base, np.array([extra_features(w) for w in windows])])


# ---------- synthetic ----------
def _bag_drop_hard(rng: np.random.Generator) -> np.ndarray:
    """bag_drop from synthetic.py with the impact raised to 8 to 20 g, so it
    overlaps the crash range. Everything else is the same recipe."""
    n = int(syn.DUR * syn.RATE)
    s = syn._base(rng, n)
    i = int(rng.uniform(2.0, 3.0) * syn.RATE)
    ff = int(rng.uniform(0.15, 0.45) * syn.RATE)
    s[i - ff : i, 1:4] *= rng.uniform(0.05, 0.3)
    amp = rng.uniform(8.0, 20.0)
    w = int(0.06 * syn.RATE)
    s[i : i + w, 3] += amp * np.hanning(w)
    s[i : i + w, 1] += 0.4 * amp * np.hanning(w) * rng.choice([-1, 1])
    tumble = int(rng.uniform(0.4, 1.2) * syn.RATE)
    s[i + w : i + w + tumble, 1:4] += rng.normal(0, 0.6, (tumble, 3)) * np.linspace(1, 0, tumble)[:, None]
    rest = n - (i + w + tumble)
    s[i + w + tumble :, 1:3] = rng.normal(0, 0.012, (rest, 2))
    s[i + w + tumble :, 3] = 1.0 + rng.normal(0, 0.012, rest)
    syn._rotate_after(s, i + w, rng.uniform(40, 110), rng)
    return s


def synthetic(n_per: int, seed: int, shifted: bool = False):
    """Synthetic rider windows from synthetic.py. shifted=True swaps in bag
    drops with crash-strength impacts (8 to 20 g), so a model that only learned
    "bag drops hit softer" is caught out. Our own model of the signal."""
    if not shifted:
        return syn.dataset(n_per=n_per, seed=seed)
    rng = np.random.default_rng(seed)
    X, y, names = [], [], []
    for name in syn.SCENARIOS:
        for _ in range(n_per):
            X.append(_bag_drop_hard(rng) if name == "bag_drop" else syn.scenario(name, rng))
            y.append(syn.LABELS[name])
            names.append(name)
    return X, np.array(y), names


def flag_rates(p: np.ndarray, names: list[str], thr: float) -> dict:
    names = np.array(names)
    return {k: float(np.mean(p[names == k] >= thr)) for k in syn.SCENARIOS}
