"""Checks for the detector pipeline. Run: python3 test_pipeline.py

No framework. Each check is one assert and fails loudly.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from features import FEATURE_NAMES, features, resample, rule_detector, window_around_peak
from synthetic import LABELS, SCENARIOS, dataset, scenario

OUT = Path(__file__).parent / "out"


def check_features_shape():
    rng = np.random.default_rng(0)
    for name in SCENARIOS:
        f = features(scenario(name, rng))
        assert f.shape == (len(FEATURE_NAMES),), name
        assert np.all(np.isfinite(f)), name


def check_resample_is_uniform():
    rng = np.random.default_rng(1)
    w = scenario("crash", rng)
    s = resample(w, 50.0)
    dt = np.diff(s[:, 0])
    assert np.allclose(dt, 0.02, atol=1e-9)
    assert 298 <= len(s) <= 300, len(s)  # 6 s at 50 Hz


def check_crash_features_look_like_a_crash():
    rng = np.random.default_rng(2)
    f = features(scenario("crash", rng))
    peak, min_g, _, _, tilt, still = f[:6]
    assert peak > 6, peak
    assert min_g < 0.5, min_g  # free fall before impact
    assert tilt > 45, tilt
    assert still > 1.5, still


def check_riding_features_look_like_riding():
    rng = np.random.default_rng(3)
    f = features(scenario("riding", rng))
    assert f[0] < 2.5, f[0]  # peak g
    assert f[3] > 0.05, f[3]  # vibration continues after the peak, unlike a crash


def check_rule_is_the_old_rule():
    assert rule_detector(np.array([14.0, 0.2, 0.3, 0.0, 85.0, 4.0, 0, 0, 0, 0]))[0] is True
    assert rule_detector(np.array([5.9, 0.2, 0.3, 0.0, 85.0, 4.0, 0, 0, 0, 0]))[0] is False
    assert rule_detector(np.array([14.0, 0.2, 0.3, 0.0, 30.0, 4.0, 0, 0, 0, 0]))[0] is False


def check_window_around_peak_is_six_seconds():
    rng = np.random.default_rng(4)
    w = scenario("crash", rng)
    w[:, 0] += 10  # arbitrary start time
    cut = window_around_peak(w)
    assert cut[0, 0] == 0
    assert cut[-1, 0] <= 6.0 + 1e-9


def check_synthetic_dataset_is_balanced_by_scenario():
    X, y, names = dataset(n_per=20, seed=5)
    assert len(X) == 20 * len(SCENARIOS)
    assert y.sum() == 20  # only crash is positive
    assert all(LABELS[n] == lab for n, lab in zip(names, y))


def check_exported_model_separates_scenarios():
    if not (OUT / "model.json").exists():
        print("  (skipped: run train.py first)")
        return
    m = json.loads((OUT / "model.json").read_text())
    assert m["kind"] == "gbm" and len(m["gbm"]["trees"]) > 0
    demo = json.loads((OUT / "demo_windows.json").read_text())

    def predict(f):
        z = m["gbm"]["baseline"]
        for tree in m["gbm"]["trees"]:
            i = 0
            while True:
                n = tree[i]
                if n["leaf"]:
                    z += n["v"]
                    break
                i = n["l"] if f[n["f"]] <= n["t"] else n["r"]
        return 1 / (1 + np.exp(-z))

    ps = {k: predict(features(np.array(v["samples"]))) for k, v in demo.items()}
    assert ps["crash"] >= 0.5, ps
    for k in ["riding", "braking", "pothole", "set_down"]:
        assert ps[k] < 0.5, (k, ps[k])


def check_results_table_claims():
    if not (OUT / "results.json").exists():
        print("  (skipped: run train.py first)")
        return
    r = json.loads((OUT / "results.json").read_text())
    gbm = r["models"]["gbm"]["umafall"]
    rule = r["models"]["rule"]["umafall"]
    assert gbm["recall"]["value"] > rule["recall"]["value"] + 0.3, "the model must beat the rule on recall by a wide margin"
    assert gbm["auroc"]["value"] > 0.98
    assert gbm["recall"]["lo"] <= gbm["recall"]["value"] <= gbm["recall"]["hi"]


if __name__ == "__main__":
    checks = [v for k, v in globals().items() if k.startswith("check_")]
    for c in checks:
        print(c.__name__)
        c()
    print(f"{len(checks)} checks passed")
