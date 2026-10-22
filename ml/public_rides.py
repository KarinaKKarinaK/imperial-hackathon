"""False alarms per hour on real two-wheeler riding from public datasets.
Evaluation only: nothing here is trained on. Run from ml/:

    python3 public_rides.py                 # all datasets found under data/public_rides/
    python3 public_rides.py --only tuwien   # one dataset
    python3 public_rides.py --simra-rides 500 # random sample of SimRa rides

Each dataset is converted to the field JSON format of stream_eval.py
({"id","kind","label","source","durationS","samples":[[t_s, ax_g, ay_g, az_g], ...]}),
written to data/public_rides/<dataset>/field/, then streamed through the shipped
model (out/model.json) with the app loop: 6 s window every 1.5 s, threshold 0.5,
one alarm per 60 s. Raw downloads stay in data/public_rides/ (gitignored); see
PUBLIC_RIDES.md for links and licences.

Datasets (download by hand, see PUBLIC_RIDES.md):
  simra/Berlin_08_2023_03_2024.zip   SimRa Rides Berlin 08/23 - 03/24, CC BY-NC 4.0
  tuwien/TrainingData.zip            TU Wien motorcyclist IMU, CC BY 4.0
  upct_scooter/jsanta-upct-scooter-riding-*/  UPCT e-scooter OBU, CC BY 4.0
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import zipfile
from collections import defaultdict
from multiprocessing import Pool
from pathlib import Path

import numpy as np

from features import resultant
from mining import WIN_S
from stream_eval import ML, ShippedModel, alarms, poisson_ci, stream_windows

ROOT = ML / "data/public_rides"
G = 9.80665
GAP_S = 2.0  # gaps longer than this are not counted as riding time
SIMRA_PLOC = {0: "pocket", 1: "handlebar", 2: "jacket pocket", 3: "hand", 4: "basket/pannier", 5: "backpack/bag", 6: "other"}
SIMRA_INCIDENT = {1: "close pass", 2: "pulling in or out", 3: "near hook", 4: "head on", 5: "tailgating", 6: "near dooring", 7: "dodging obstacle", 8: "other"}


def riding_seconds(t: np.ndarray) -> float:
    d = np.diff(t)
    return float(d[d <= GAP_S].sum())


def write_seg(out: Path, seg_id: str, label: str, source: str, sig: np.ndarray, extra: dict | None = None) -> None:
    """Split at gaps over GAP_S so no window interpolates across missing data,
    then write one field JSON per piece."""
    cut = np.flatnonzero(np.diff(sig[:, 0]) > GAP_S) + 1
    pieces = [x for x in np.split(sig, cut) if len(x) >= 10]
    for k, x in enumerate(pieces):
        e = dict(extra or {})
        if "incidents" in e:
            e["incidents"] = [i for i in e["incidents"] if x[0, 0] - 5 <= i["t"] <= x[-1, 0] + 5]
        _write(out, seg_id if len(pieces) == 1 else f"{seg_id}_p{k}", label, source, x, e)


def _write(out: Path, seg_id: str, label: str, source: str, sig: np.ndarray, extra: dict | None = None) -> None:
    d = {"id": seg_id, "kind": "ride", "label": label, "source": source,
         "durationS": round(riding_seconds(sig[:, 0]), 3),
         "samples": np.round(sig, 5).tolist()}
    if extra:
        d.update(extra)
    (out / f"{re.sub(r'[^A-Za-z0-9_.-]', '_', seg_id)}.json").write_text(json.dumps(d))


# ---------- converters ----------
def convert_simra(n_rides: int, seed: int = 0) -> Path | None:
    """SimRa ride files: accelerometer X, Y, Z in m/s^2 with gravity (Android
    TYPE_ACCELEROMETER; iOS writes CoreMotion g times 9.81). Android polls every
    50 ms and logs a 30-poll mean (1.5 s) every 5th poll, about 4 rows a second.
    iOS polls at 50 Hz and logs a 30-poll mean (0.6 s), about 10 rows a second.
    Incidents are near misses, not crashes."""
    zips = sorted((ROOT / "simra").glob("*.zip"))
    if not zips:
        return None
    out = ROOT / "simra/field"
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.json"):
        f.unlink()
    z = zipfile.ZipFile(zips[0])
    names = sorted(n for n in z.namelist() if "/Rides/" in n and not n.endswith("/"))
    if n_rides > 0:
        names = sorted(np.random.default_rng(seed).choice(names, min(n_rides, len(names)), replace=False))
    bad = defaultdict(int)
    for n in names:
        lines = z.read(n).decode("utf-8", "replace").splitlines()
        # Android files use 25 "=", iOS files ("i" app version) use fewer
        sep = next((i for i, l in enumerate(lines) if l.strip() and set(l.strip()) == {"="}), None)
        if sep is None:
            bad["no separator"] += 1
            continue
        incidents, ploc = [], None
        for row in csv.DictReader(io.StringIO("\n".join(lines[1:sep]).strip())):
            try:
                ploc = int(row["pLoc"]) if row.get("pLoc") not in (None, "") else ploc
                kind = int(row["incident"]) if row.get("incident") not in (None, "") else 0
                if kind in SIMRA_INCIDENT and row.get("ts"):
                    incidents.append({"t": int(row["ts"]) / 1000.0, "type": SIMRA_INCIDENT[kind], "scary": row.get("scary") == "1"})
            except ValueError:
                pass
        rows = []
        for row in csv.DictReader(io.StringIO("\n".join(lines[sep + 2:]))):
            try:
                rows.append([int(row["timeStamp"]) / 1000.0, float(row["X"]), float(row["Y"]), float(row["Z"])])
            except (ValueError, KeyError, TypeError):
                pass
        if len(rows) < 50:
            bad["under 50 rows"] += 1
            continue
        sig = np.array(rows)
        sig = sig[np.any(sig[:, 1:] != 0, axis=1)]  # iOS GPS rows carry 0,0,0
        sig = sig[np.argsort(sig[:, 0])]
        if len(sig) < 50:
            bad["under 50 rows"] += 1
            continue
        mag = float(np.median(resultant(sig)))
        os_ = "iOS" if lines[0].startswith("i") else "Android"
        if 7.0 < mag < 12.5:
            sig[:, 1:] /= 9.81 if os_ == "iOS" else G  # the iOS app writes g * 9.81
        elif not 0.7 < mag < 1.3:
            bad[f"median |a| {mag:.1f}, unknown unit"] += 1
            continue
        t0 = sig[0, 0]
        sig[:, 0] -= t0
        for inc in incidents:
            inc["t"] -= t0
        write_seg(out, "simra_" + n.split("/")[-1], "riding", f"phone, {SIMRA_PLOC.get(ploc, 'unknown')}", sig,
                  {"incidents": incidents, "os": os_, "unit": "m/s^2" if mag > 2 else "g"})
    print(f"SimRa: {len(names)} ride files read from {zips[0].name}, skipped {dict(bad) or 0}")
    return out


def convert_tuwien() -> Path | None:
    """10 s CSV clips from an Xsens MTi on a motorbike, Acc_X/Y/Z in m/s^2 with
    gravity, SampleTimeFine in 100 us ticks. Clips of one occurrence are joined
    back on SampleTimeFine, overlap removed. Timer wrap is not handled: a
    wrap inside one occurrence would show as a gap and split it."""
    zp = ROOT / "tuwien/TrainingData.zip"
    if not zp.exists():
        return None
    out = ROOT / "tuwien/field"
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.json"):
        f.unlink()
    z = zipfile.ZipFile(zp)
    groups = defaultdict(list)
    pat = re.compile(r"^([a-z]+)/([a-z]+)(\d+)_Daten_(\d{4}_\d{2}_\d{2}[A-Za-z]*)_(\d+)\.csv$")
    for n in z.namelist():
        m = pat.match(n)
        if m:
            groups[(m[2], int(m[3]), m[4])].append((int(m[5]), n))
    n_seg, n_clip = 0, 0
    for (beh, occ, day), clips in sorted(groups.items()):
        rows = []
        for _, n in sorted(clips):
            r = list(csv.DictReader(io.StringIO(z.read(n).decode())))
            n_clip += 1
            rows += [[float(x["SampleTimeFine"]) / 1e4, float(x["Acc_X"]), float(x["Acc_Y"]), float(x["Acc_Z"])] for x in r]
        if not rows:
            continue
        a = np.array(rows)
        # clips overlap by half (10 s clips every 5 s): keep each sample once
        _, keep = np.unique(a[:, 0], return_index=True)
        a = a[np.sort(keep)]
        a = a[np.argsort(a[:, 0])]
        sig = np.column_stack([a[:, 0] - a[0, 0], a[:, 1:] / G])
        write_seg(out, f"tuwien_{day}_{beh}{occ}", beh, "motorbike IMU", sig)
        n_seg += 1
    print(f"TU Wien: {n_clip} clips (10 s, overlapping by 5 s) joined into {n_seg} behaviour occurrences, split at gaps over {GAP_S} s")
    return out


def convert_upct() -> Path | None:
    """Android phone used as an on-board unit on an e-scooter. Accelerometer.csv
    in m/s^2 with gravity, Milliseconds since start, about 100 Hz. Riding
    folders are normal rides; overturn and collision folders are staged falls,
    5 repetitions each."""
    base = sorted((ROOT / "upct_scooter").glob("jsanta-upct-scooter-riding-*"))
    if not base:
        return None
    out = ROOT / "upct_scooter/field"
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.json"):
        f.unlink()
    for d in sorted(p for p in base[0].iterdir() if p.is_dir()):
        name = d.name.lower()
        if "riding" in name:
            label = "riding"
        elif "overturn" in name or "collisi" in name:
            label = "staged_fall"
        else:
            continue  # static device in hand, not riding
        r = list(csv.DictReader((d / "Accelerometer.csv").open()))
        sig = np.array([[float(x["Milliseconds"]) / 1000.0, float(x["X"]), float(x["Y"]), float(x["Z"])] for x in r])
        # the logger drops out: the clock stops and the last row is repeated
        # until it resumes seconds later. Keep only rows with a new time stamp.
        sig = sig[np.r_[True, np.diff(sig[:, 0]) > 0]]
        sig[:, 1:] /= G
        write_seg(out, "upct_" + d.name, label, "scooter-mounted phone", sig)
    print(f"UPCT scooter: {len(list(out.glob('*.json')))} field files (recordings split at logger gaps)")
    return out


# ---------- scoring ----------
_model: ShippedModel | None = None


def _init():
    global _model
    _model = ShippedModel(ML / "out/model.json")


def _score(path: Path):
    d = json.loads(path.read_text())
    sig = np.asarray(d["samples"], dtype=float).reshape(-1, 4)
    ends, F = stream_windows(sig)
    p = _model.predict_proba(F)[:, 1] if len(F) else np.array([])
    al = alarms(ends, p, _model.thr)
    r = resultant(sig)
    return {"id": d["id"], "label": d["label"], "source": d["source"], "s": float(d["durationS"]),
            "alarms": al, "ends": ends, "p": p, "incidents": d.get("incidents", []), "os": d.get("os"),
            "rate": len(sig) / max(sig[-1, 0] - sig[0, 0], 1e-9), "peak_g": float(r.max()), "t": sig[:, 0], "r": r}


def report(name: str, folder: Path, workers: int) -> None:
    files = sorted(folder.glob("*.json"))
    with Pool(workers, initializer=_init) as pool:
        res = pool.map(_score, files, chunksize=4)
    thr = ShippedModel(ML / "out/model.json").thr
    rides = [x for x in res if x["label"] != "staged_fall"]
    h = sum(x["s"] for x in rides) / 3600
    k = sum(len(x["alarms"]) for x in rides)
    lo, hi = poisson_ci(k, h)
    nwin = sum(len(x["ends"]) for x in rides)
    allp = np.concatenate([x["p"] for x in rides if len(x["p"])]) if nwin else np.array([])
    print(f"\n===== {name} =====")
    print(f"rides: {len(rides)} segments, {h:.2f} h, median rate {np.median([x['rate'] for x in rides]):.1f} Hz, {nwin} windows scored")
    print(f"false alarms: {k} = {k / h:.4f} per hour, Poisson 95% [{lo:.4f}, {hi:.4f}]; per 1000 h {1000 * k / h:.1f} [{1000 * lo:.1f}, {1000 * hi:.1f}]")
    if nwin:
        print(f"window scores: p99 {np.percentile(allp, 99):.3f}, max {allp.max():.3f}, windows >= {thr}: {(allp >= thr).sum()}, >= 0.2: {(allp >= 0.2).sum()}")
    by = defaultdict(lambda: [0.0, 0, 0])
    for x in rides:
        key = x["source"] if name == "SimRa" else x["label"]
        by[key][0] += x["s"] / 3600
        by[key][1] += len(x["alarms"])
        by[key][2] += 1
        if x.get("os"):
            by[x["os"]][0] += x["s"] / 3600
            by[x["os"]][1] += len(x["alarms"])
            by[x["os"]][2] += 1
    for key, (hh, kk, nn) in sorted(by.items(), key=lambda kv: -kv[1][0]):
        print(f"  {key}: {nn} segments, {hh:.2f} h, {kk} alarms")
    fired = [x for x in rides if x["alarms"]]
    for x in fired:
        print(f"  fired: {x['id']} ({x['source']}, {x['label']}) at {[round(a, 1) for a in x['alarms']]} s, segment peak {x['peak_g']:.2f} g")
    inc = [(x, i) for x in rides for i in x["incidents"]]
    if inc:
        near = 0
        for x, i in inc:
            if any(abs(a - i["t"]) <= 10 for a in x["alarms"]):
                near += 1
        print(f"labelled near-miss incidents: {len(inc)} in {sum(1 for x in rides if x['incidents'])} rides, alarm within 10 s of {near}")
    falls = defaultdict(lambda: [0.0, 0, 0, 0, 0, []])  # data s, impacts, flagged, caught, alarms, peak g
    for x in res:
        if x["label"] != "staged_fall":
            continue
        # impacts: resultant peaks of 3 g or more, at least 5 s apart
        t, r = x["t"], x["r"]
        peaks = []
        for j in np.argsort(-r):
            if r[j] < 3:
                break
            if all(abs(t[j] - t[q]) >= 5 for q in peaks):
                peaks.append(j)
        f = falls[re.sub(r"_p\d+$", "", x["id"])]
        f[0] += x["s"]
        f[1] += len(peaks)
        f[2] += sum(1 for q in peaks if any(pi >= thr and te - WIN_S < t[q] <= te for te, pi in zip(x["ends"], x["p"])))
        f[3] += sum(1 for q in peaks if any(a - WIN_S < t[q] <= a for a in x["alarms"]))
        f[4] += len(x["alarms"])
        f[5] += np.round(r[peaks], 1).tolist()
    if falls:
        tot = np.array([v[1:5] for v in falls.values()]).sum(axis=0)
        print(f"staged falls (5 repetitions per recording, logger gaps hide some): impacts >= 3 g seen {tot[0]}, "
              f"a window over the impact flagged {tot[1]}, caught by the app loop {tot[2]}, alarms {tot[3]}")
        for key, v in sorted(falls.items()):
            print(f"  {key}: {v[0]:.0f} s of data, impacts {sorted(v[5], reverse=True)} g, flagged {v[2]}/{v[1]}, app alarms {v[4]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["simra", "tuwien", "upct"], help="run one dataset")
    ap.add_argument("--simra-rides", type=int, default=0, help="SimRa rides to use, a random sample (seed 0); 0 for all")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()
    jobs = {"simra": ("SimRa", lambda: convert_simra(args.simra_rides)),
            "tuwien": ("TU Wien motorbike", convert_tuwien),
            "upct": ("UPCT e-scooter", convert_upct)}
    for key, (name, conv) in jobs.items():
        if args.only and key != args.only:
            continue
        folder = conv()
        if folder is None:
            print(f"{name}: no download under {ROOT}, skipped")
            continue
        report(name, folder, args.workers)


if __name__ == "__main__":
    main()
