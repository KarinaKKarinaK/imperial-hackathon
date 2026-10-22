"""Fixed-threshold sweep for the recommended recipe (synthetic all + extra
features). Out-of-fold on UMAFall, held-out seed on synthetic.
Usage (from ml/): python experiments/sweep.py"""
import numpy as np
from sklearn.model_selection import GroupKFold
import run as R

oof = np.zeros(len(R.y)); pte = []
for name, extra in [("baseline", False), ("synthetic all + extra", True)]:
    syn_mode = None if name == "baseline" else "all"
    pte = []
    for tr, te in GroupKFold(5).split(R.F[extra], R.y, R.groups):
        Xtr, ytr = R.train_rows(tr, extra, syn_mode, ())
        o = R.fit_predict(R.SHIPPED, Xtr, ytr, [R.F[extra][te], R.SF["te"][extra]])
        oof[te] = o[0]; pte.append(o[1])
    pte = np.mean(pte, axis=0)
    print(f"\n{name}\n| Threshold | Recall | Precision | FP | FN | bag_drop | crash (syn) | cost 10:1 |\n|---|---|---|---|---|---|---|---|")
    for t in [0.1, 0.2, 0.3, 0.4, 0.5]:
        p = oof >= t; y = R.y
        fp, fn, tp = int((p & (y == 0)).sum()), int((~p & (y == 1)).sum()), int((p & (y == 1)).sum())
        fr = R.flag_rates(pte, R.S_TE[2], t)
        print(f"| {t:.1f} | {tp/(tp+fn):.3f} | {tp/(tp+fp):.3f} | {fp} | {fn} | {fr['bag_drop']:.2f} | {fr['crash']:.2f} | {10*fn+fp} |")
