"""Loader for the UMAFall dataset (Casilari and Santoyo-Ramon, Universidad de
Malaga, CC BY 4.0). Download: https://figshare.com/articles/dataset/4214283

Each file is one trial: 19 subjects, 12 activities of daily living and 3 fall
types, five sensors. Sensor 0 is the smartphone in the right trouser pocket at
about 200 Hz, which is the closest thing in a public dataset to the phone our
rider carries. Sensors 1 to 4 are SensorTags at 20 Hz on chest, waist, wrist
and ankle.
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

NAME_RE = re.compile(r"UMAFall_Subject_(\d+)_(ADL|Fall)_([A-Za-z]+)_(\d+)_")
SENSORS = {0: "phone", 1: "chest", 2: "waist", 3: "wrist", 4: "ankle"}


@dataclass
class Trial:
    subject: int
    label: int  # 1 fall, 0 ADL
    activity: str
    trial: int
    path: Path
    signals: dict[str, np.ndarray]  # sensor name -> [t_s, ax, ay, az] in g


def load_trial(path: Path) -> Trial | None:
    m = NAME_RE.search(path.name)
    if not m:
        return None
    rows = [l for l in path.read_text(encoding="latin-1").splitlines() if l.strip() and not l.startswith("%")]
    df = pd.read_csv(io.StringIO("\n".join(rows)), sep=";", header=None, usecols=range(7), names=["ts", "n", "x", "y", "z", "type", "sid"])
    acc = df[df["type"] == 0]
    signals = {}
    for sid, name in SENSORS.items():
        d = acc[acc["sid"] == sid]
        if len(d) < 20:
            continue
        t = (d["ts"].to_numpy(dtype=float) - d["ts"].iloc[0]) / 1000.0
        signals[name] = np.column_stack([t, d["x"], d["y"], d["z"]]).astype(float)
    if not signals:
        return None
    return Trial(int(m.group(1)), 1 if m.group(2) == "Fall" else 0, m.group(3), int(m.group(4)), path, signals)


def load_all(root: Path) -> list[Trial]:
    trials = []
    for p in sorted(root.glob("UMAFall_Subject_*.csv")):
        t = load_trial(p)
        if t:
            trials.append(t)
    return trials
