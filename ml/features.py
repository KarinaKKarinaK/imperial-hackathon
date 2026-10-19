"""Window features for crash and fall detection.

The same ten features are computed in TypeScript (web/src/lib/features.ts) so a
model trained here runs unchanged on the server and on the phone. Keep the two
in step: every change here needs a matching change there and a new set of
parity vectors (train.py writes them).

Input: samples as an (n, 4) array of [t_seconds, ax, ay, az] in g. Any sampling
rate. Output: a fixed-length feature vector.
"""

from __future__ import annotations

import numpy as np

RATE_HZ = 50.0
WINDOW_S = 6.0
STILL_BAND_G = 0.25

FEATURE_NAMES = [
    "peak_g",  # max resultant
    "min_g",  # min resultant before the peak (free fall shows as a dip)
    "pre_std",  # resultant std in the 1.5 s before the peak
    "post_std",  # resultant std from 1 s after the peak to the end
    "tilt_deg",  # angle between gravity before and after the peak
    "still_s",  # longest run after the peak with |r - 1| < 0.25 g
    "jerk_max",  # max |d r / dt| in g/s
    "above_2g_s",  # seconds with r > 2 g
    "lag_s",  # time from the pre-peak minimum to the peak
    "energy",  # mean (r - 1)^2 over the window
]


def resample(samples: np.ndarray, rate_hz: float = RATE_HZ) -> np.ndarray:
    """Linear resample of [t, ax, ay, az] rows onto a uniform grid."""
    s = samples[np.argsort(samples[:, 0])]
    t = s[:, 0]
    if len(t) < 2 or t[-1] - t[0] <= 0:
        return s
    grid = np.arange(t[0], t[-1], 1.0 / rate_hz)
    out = np.empty((len(grid), 4))
    out[:, 0] = grid
    for k in range(1, 4):
        out[:, k] = np.interp(grid, t, s[:, k])
    return out


def resultant(s: np.ndarray) -> np.ndarray:
    return np.sqrt(s[:, 1] ** 2 + s[:, 2] ** 2 + s[:, 3] ** 2)


def _angle(u: np.ndarray, v: np.ndarray) -> float:
    nu = np.linalg.norm(u) or 1.0
    nv = np.linalg.norm(v) or 1.0
    c = float(np.clip(np.dot(u, v) / (nu * nv), -1.0, 1.0))
    return float(np.degrees(np.arccos(c)))


def features(samples: np.ndarray, rate_hz: float = RATE_HZ) -> np.ndarray:
    s = resample(np.asarray(samples, dtype=float), rate_hz)
    n = len(s)
    if n < 5:
        return np.zeros(len(FEATURE_NAMES))
    dt = 1.0 / rate_hz
    r = resultant(s)
    p = int(np.argmax(r))
    peak = float(r[p])

    pre = r[: max(p, 1)]
    min_g = float(pre.min())
    lag_s = float((p - int(np.argmin(pre))) * dt) if p > 0 else 0.0

    pre_win = r[max(0, p - int(1.5 * rate_hz)) : max(p, 1)]
    pre_std = float(pre_win.std()) if len(pre_win) > 1 else 0.0

    post_start = min(n - 1, p + int(1.0 * rate_hz))
    post = r[post_start:]
    post_std = float(post.std()) if len(post) > 1 else 0.0

    g_before = s[max(0, p - int(1.0 * rate_hz)) : max(p, 1), 1:4].mean(axis=0)
    tail = s[min(n - 1, p + int(0.5 * rate_hz)) :, 1:4]
    g_after = tail.mean(axis=0) if len(tail) else g_before
    tilt = _angle(g_before, g_after)

    still = np.abs(r[p + 1 :] - 1.0) < STILL_BAND_G
    best = run = 0
    for v in still:
        run = run + 1 if v else 0
        best = max(best, run)
    still_s = best * dt

    jerk = float(np.max(np.abs(np.diff(r)) / dt)) if n > 1 else 0.0
    above_2g_s = float(np.sum(r > 2.0) * dt)
    energy = float(np.mean((r - 1.0) ** 2))

    return np.array([peak, min_g, pre_std, post_std, tilt, still_s, jerk, above_2g_s, lag_s, energy])


def window_around_peak(samples: np.ndarray, before_s: float = 2.5, after_s: float = 3.5) -> np.ndarray:
    """Cut a fixed window around the strongest impact in a recording."""
    s = np.asarray(samples, dtype=float)
    s = s[np.argsort(s[:, 0])]
    r = resultant(s)
    tp = s[int(np.argmax(r)), 0]
    m = (s[:, 0] >= tp - before_s) & (s[:, 0] <= tp + after_s)
    w = s[m].copy()
    w[:, 0] -= w[0, 0]
    return w


def rule_detector(f: np.ndarray) -> tuple[bool, float]:
    """The original threshold rule, kept as the baseline row in the results."""
    peak, _, _, _, tilt, still_s = f[:6]
    conf = min(1.0, peak / 6.0) * min(1.0, tilt / 60.0) * min(1.0, still_s / 3.0)
    return bool(peak >= 6.0 and tilt >= 60.0 and still_s >= 3.0), float(conf)
