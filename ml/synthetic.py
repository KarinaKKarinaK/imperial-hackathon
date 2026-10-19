"""Synthetic rider telemetry for demos and stress tests.

UMAFall gives us real falls, but nobody has a public dataset of delivery riders
crashing with a helmet sensor. This generator produces the situations a rider
sensor actually meets, labelled, so we can show how the system behaves and
test the model under domain shift. It is a model of the signal, not of the
world: say so wherever these numbers appear.

Each scenario returns [t_s, ax, ay, az] in g at 100 Hz over a 6 s window.
"""

from __future__ import annotations

import numpy as np

RATE = 100.0
DUR = 6.0

SCENARIOS = [
    "riding",  # upright, road vibration
    "braking",  # hard brake, longitudinal 0.4 to 0.7 g, no fall
    "pothole",  # short vertical spike 2 to 6 g, no tilt, riding continues
    "set_down",  # phone put down hard: spike then still, but no tilt and no free fall
    "bag_drop",  # phone falls in a bag: free fall, impact, tilt, then stillness
    "crash",  # free fall, impact 8 to 25 g, large tilt, stillness
]


def _base(rng: np.random.Generator, n: int, vib: float = 0.18) -> np.ndarray:
    t = np.arange(n) / RATE
    ax = rng.normal(0, vib * 0.6, n)
    ay = rng.normal(0, vib * 0.6, n)
    az = 1.0 + rng.normal(0, vib, n) + 0.06 * np.sin(2 * np.pi * 1.7 * t)
    return np.column_stack([t, ax, ay, az])


def _rotate_after(s: np.ndarray, i: int, deg: float, rng: np.random.Generator) -> None:
    """Swing the gravity vector by deg after sample i over about 0.5 s."""
    th = np.radians(deg)
    axis = rng.normal(size=3)
    axis /= np.linalg.norm(axis)
    for k in range(i, len(s)):
        a = th * min(1.0, (k - i) / (0.5 * RATE))
        v = s[k, 1:4]
        c, sn = np.cos(a), np.sin(a)
        s[k, 1:4] = v * c + np.cross(axis, v) * sn + axis * np.dot(axis, v) * (1 - c)


def scenario(name: str, rng: np.random.Generator) -> np.ndarray:
    n = int(DUR * RATE)
    s = _base(rng, n)
    i = int(rng.uniform(2.0, 3.0) * RATE)
    if name == "riding":
        return s
    if name == "braking":
        dur = int(rng.uniform(0.6, 1.4) * RATE)
        s[i : i + dur, 2] -= rng.uniform(0.4, 0.7)
        return s
    if name == "pothole":
        amp = rng.uniform(2.0, 6.0)
        w = int(0.08 * RATE)
        s[i : i + w, 3] += amp * np.hanning(w)
        s[i + w : i + 2 * w, 3] -= 0.6 * np.hanning(w)
        return s
    if name == "set_down":
        amp = rng.uniform(3.0, 9.0)
        w = int(0.05 * RATE)
        s[i : i + w, 3] += amp * np.hanning(w)
        s[i + w :, 1:3] = rng.normal(0, 0.01, (n - i - w, 2))
        s[i + w :, 3] = 1.0 + rng.normal(0, 0.01, n - i - w)
        if rng.random() < 0.4:
            _rotate_after(s, i + w, rng.uniform(5, 35), rng)
        return s
    if name in ("bag_drop", "crash"):
        ff = int(rng.uniform(0.15, 0.45) * RATE)
        s[i - ff : i, 1:4] *= rng.uniform(0.05, 0.3)
        amp = rng.uniform(5.0, 12.0) if name == "bag_drop" else rng.uniform(8.0, 25.0)
        w = int(0.06 * RATE)
        s[i : i + w, 3] += amp * np.hanning(w)
        s[i : i + w, 1] += 0.4 * amp * np.hanning(w) * rng.choice([-1, 1])
        tumble = int(rng.uniform(0.4, 1.2) * RATE)
        s[i + w : i + w + tumble, 1:4] += rng.normal(0, 0.6, (tumble, 3)) * np.linspace(1, 0, tumble)[:, None]
        rest = n - (i + w + tumble)
        s[i + w + tumble :, 1:3] = rng.normal(0, 0.012, (rest, 2))
        s[i + w + tumble :, 3] = 1.0 + rng.normal(0, 0.012, rest)
        _rotate_after(s, i + w, rng.uniform(60, 120) if name == "crash" else rng.uniform(40, 110), rng)
        return s
    raise ValueError(name)


LABELS = {"riding": 0, "braking": 0, "pothole": 0, "set_down": 0, "bag_drop": 0, "crash": 1}


def dataset(n_per: int = 200, seed: int = 7) -> tuple[list[np.ndarray], np.ndarray, list[str]]:
    rng = np.random.default_rng(seed)
    X, y, names = [], [], []
    for name in SCENARIOS:
        for _ in range(n_per):
            X.append(scenario(name, rng))
            y.append(LABELS[name])
            names.append(name)
    return X, np.array(y), names
