"""Streaming windows and hard negative mining, shared by train.py, stream_eval.py and audit.py.

The model is trained on one window per trial, cut around the biggest peak. The
app scores a 6 s window every 1.5 s. Windows the app sees but training never
did (the phone coming out of a pocket, the second after a hop) are where the
false alarms come from. Hard negative mining slides the app's window over the
daily activity recordings of the TRAINING subjects, adds every window the model
scores at MINE_THR or above as an extra negative, retrains, and repeats.
Held-out subjects are never touched.
"""

from __future__ import annotations

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier

from features import FEATURE_NAMES, features

WIN_S, HOP_S = 6.0, 1.5
MINE_ROUNDS = 2
MINE_THR = 0.2


def gbm() -> HistGradientBoostingClassifier:
    return HistGradientBoostingClassifier(max_depth=3, learning_rate=0.08, max_iter=200, class_weight="balanced", random_state=0)


def stream_windows(sig: np.ndarray, skip_short: bool = True) -> tuple[np.ndarray, np.ndarray]:
    """Window end times and feature rows, as the phone would post them. Like
    the app, skip windows with under 10 samples or under 0.5 s span."""
    s = sig[np.argsort(sig[:, 0])]
    t = s[:, 0]
    ends, feats = [], []
    te = t[0] + HOP_S
    while te <= t[-1] + 1e-9:
        lo, hi = np.searchsorted(t, te - WIN_S, side="right"), np.searchsorted(t, te, side="right")
        w = s[lo:hi]
        if not skip_short or (len(w) >= 10 and w[-1, 0] - w[0, 0] >= 0.5):
            ends.append(te)
            feats.append(features(w))
        te += HOP_S
    return np.array(ends), np.array(feats).reshape(-1, len(FEATURE_NAMES))


def fit_mined(X: np.ndarray, y: np.ndarray, negatives: np.ndarray, rounds: int = MINE_ROUNDS, thr: float = MINE_THR):
    """Fit gradient boosting on (X, y), then for each round add the rows of
    `negatives` (streaming windows of training-subject daily activities) that
    the current model scores at thr or above, and refit. Returns the model and
    how many windows were mined."""
    model = gbm().fit(X, y)
    if rounds <= 0 or len(negatives) == 0:
        return model, 0
    mined = np.zeros(len(negatives), bool)
    for _ in range(rounds):
        mined |= model.predict_proba(negatives)[:, 1] >= thr
        model = gbm().fit(np.vstack([X, negatives[mined]]), np.concatenate([y, np.zeros(int(mined.sum()), dtype=y.dtype)]))
    return model, int(mined.sum())
