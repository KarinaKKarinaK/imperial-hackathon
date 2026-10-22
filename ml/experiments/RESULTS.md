# Crash detector experiments

Measured on 22 Oct 2026. Same protocol as `train.py`: UMAFall phone accelerometer, 625 trials (208 falls), 19 subjects, 5-fold GroupKFold by subject, 6 s window at 50 Hz, 95% bootstrap CIs over trials (1000 resamples). Every model is gradient boosting (HistGradientBoosting) unless the row says otherwise.

Synthetic numbers come from `synthetic.py`, our own model of the rider signal. Training uses seed 101 (150 windows per scenario), testing uses seed 202 (300 per scenario), so no synthetic window is in both. "bag_drop shifted" is a harder test set (seed 303) where bag drops hit as hard as crashes (8 to 20 g instead of 5 to 12 g).

## Reproduce

```
cd ml
python experiments/run.py      # about 5 minutes, writes results.json and results_tables.md
python experiments/sweep.py    # threshold sweep, under a minute
```

## Main table

UMAFall columns are out-of-fold. FP and FN are trial counts out of 417 ADLs and 208 falls. Synthetic columns are the share of windows flagged as a crash.

| Variant | Precision | Recall | F1 | AUROC | Brier | FP | FN | bag_drop | set_down | crash (syn) | bag_drop shifted |
|---|---|---|---|---|---|---|---|---|---|---|---|
| baseline (train.py evaluation, UMAFall only) | 0.930 [0.894, 0.960] | 0.952 [0.921, 0.980] | 0.941 [0.915, 0.963] | 0.994 [0.989, 0.997] | 0.032 | 15 | 10 | 0.98 | 0.01 | 0.99 | 0.98 |
| + extra features | 0.935 [0.902, 0.968] | 0.966 [0.941, 0.990] | 0.950 [0.929, 0.972] | 0.996 [0.994, 0.999] | 0.026 | 14 | 7 | 0.95 | 0.00 | 0.94 | 0.95 |
| + waist and chest windows | 0.886 [0.846, 0.926] | 0.976 [0.954, 0.995] | 0.929 [0.904, 0.952] | 0.994 [0.989, 0.997] | 0.037 | 26 | 5 | 1.00 | 0.02 | 1.00 | 1.00 |
| tuned (nested random search) | 0.938 [0.902, 0.967] | 0.952 [0.921, 0.981] | 0.945 [0.921, 0.968] | 0.989 [0.982, 0.996] | 0.033 | 13 | 10 | 0.98 | 0.01 | 0.99 | 0.96 |
| Platt calibration | 0.933 [0.899, 0.964] | 0.942 [0.909, 0.972] | 0.938 [0.914, 0.960] | 0.983 [0.972, 0.992] | 0.034 | 14 | 12 | 0.97 | 0.01 | 0.99 | 0.96 |
| isotonic calibration | 0.918 [0.882, 0.952] | 0.966 [0.940, 0.990] | 0.941 [0.918, 0.963] | 0.989 [0.980, 0.995] | 0.032 | 18 | 7 | 0.97 | 0.01 | 0.99 | 0.98 |
| cost threshold 10:1 | 0.895 [0.857, 0.935] | 0.986 [0.968, 1.000] | 0.938 [0.915, 0.962] | 0.994 [0.989, 0.997] | 0.032 | 24 | 3 | 1.00 | 0.03 | 0.99 | 1.00 |
| + synthetic hard negatives | 0.926 [0.889, 0.960] | 0.962 [0.935, 0.985] | 0.943 [0.919, 0.964] | 0.990 [0.983, 0.995] | 0.032 | 16 | 8 | 0.16 | 0.00 | 0.86 | 0.68 |
| + synthetic all scenarios | 0.912 [0.873, 0.948] | 0.952 [0.921, 0.978] | 0.932 [0.905, 0.955] | 0.988 [0.980, 0.994] | 0.034 | 19 | 10 | 0.20 | 0.00 | 0.90 | 0.73 |
| + synthetic all + extra features | 0.930 [0.891, 0.963] | 0.957 [0.927, 0.981] | 0.943 [0.919, 0.965] | 0.996 [0.993, 0.998] | 0.027 | 15 | 9 | 0.19 | 0.00 | 0.87 | 0.70 |
| + synthetic all + cost threshold | 0.855 [0.811, 0.898] | 0.990 [0.976, 1.000] | 0.918 [0.891, 0.943] | 0.988 [0.980, 0.994] | 0.034 | 35 | 2 | 0.57 | 0.00 | 0.99 | 0.90 |
| + synthetic all + extra + cost | 0.884 [0.839, 0.926] | 0.986 [0.970, 1.000] | 0.932 [0.905, 0.957] | 0.996 [0.993, 0.998] | 0.027 | 27 | 3 | 0.45 | 0.00 | 0.98 | 0.90 |
| + synthetic all + tuned + cost | 0.854 [0.808, 0.897] | 0.986 [0.969, 1.000] | 0.915 [0.887, 0.941] | 0.988 [0.981, 0.994] | 0.038 | 35 | 3 | 0.63 | 0.01 | 1.00 | 0.91 |

The baseline row matches `out/results.md` exactly, so the two are comparable. Paired bootstrap deltas against the baseline are in `results_tables.md`. Recall or FP count moves with a CI that excludes zero only for the lower thresholds and the waist and chest augmentation (more FP). Every F1 delta CI includes zero except "synthetic all + tuned + cost", which is worse.

Cost threshold rows pick the threshold inside each training fold (inner 4-fold by subject) to minimise 10 x missed falls + 1 x false alarms, then apply it to the held-out subjects. Calibration rows fit the calibrator on inner out-of-fold scores in the same way. No test subject touches any choice.

## Threshold sweep, recommended recipe

Out-of-fold, so a little optimistic for the chosen point. The nested rows above are the honest check.

| Threshold | Recall | Precision | FP | FN | bag_drop | crash (syn) | cost 10:1 |
|---|---|---|---|---|---|---|---|
| 0.1 | 1.000 | 0.889 | 26 | 0 | 0.52 | 0.99 | 26 |
| 0.2 | 0.981 | 0.915 | 19 | 4 | 0.39 | 0.96 | 59 |
| 0.3 | 0.971 | 0.914 | 19 | 6 | 0.29 | 0.93 | 79 |
| 0.5 | 0.957 | 0.930 | 15 | 9 | 0.19 | 0.87 | 105 |

Baseline at 0.5 for comparison: recall 0.952, FP 15, FN 10, bag_drop 0.98, cost 115.

## What helped

- **Synthetic negatives in training.** Bag drop false alarms on held-out synthetic windows fall from 0.98 to 0.16 to 0.20 with no measurable change on UMAFall. This is the only thing that moved bag drops.
- **Lower threshold.** At 10:1 cost, the nested threshold cut missed falls from 10 to 3 for 9 to 12 extra false alarms. On the stated cost that is a clear win. With the 30 s cancel window a false alarm is cheap.
- **Extra features**, a little. AUROC 0.994 to 0.996 and Brier 0.032 to 0.026 (better calibrated without a calibrator). The F1 gain is inside the noise. It helps most when the threshold is low: with synthetic training plus cost threshold it saves 8 false alarms against the 10-feature version (27 vs 35) at nearly the same recall (0.986 vs 0.990).

## What did not help

- **Hyperparameter tuning.** Nested random search (30 of 162 configs) chose different settings in every fold and did not beat the shipped settings. The shipped settings are fine.
- **Calibration.** Platt and isotonic did not improve Brier (already 0.032) and cost a little AUROC. Not worth the export step.
- **Waist and chest windows as augmentation.** More recall, but 11 more false alarms. The 20 Hz SensorTags look different from a phone.
- **Rotation augmentation.** Skipped on purpose: all 10 shipped features and all 9 new ones use the resultant or angles between gravity vectors, so they do not change when the device is rotated. Helmet mounting angle does not matter to the model.
- **Gyroscope.** The UMAFall phone recorded only the accelerometer. Gyro exists only on the 20 Hz SensorTags, so there is no phone gyro to use.
- **SisFall cross-dataset test.** Skipped. The official site (sistemic.udea.edu.co) did not respond, and the only copies are unofficial GitHub mirrors. It is also a waist device, not a phone.

## The bag drop result is weaker than it looks

- In `synthetic.py`, a bag drop and a crash use the same recipe: free fall, impact, tumble, tilt, stillness. They differ only in impact size (5 to 12 g vs 8 to 25 g) and tilt range. On the synthetic test set, peak g alone separates them with AUROC 0.935. Tilt alone gets 0.727. None of the new features beat peak g.
- The **shifted** test shows it. Raise bag drops to crash strength and the trained models flag 0.68 to 0.73 of them again. The model learned "bag drops hit softer", which is true of our generator and unknown for real bags.
- Synthetic crash recall falls from 0.99 to 0.86 to 0.90 at threshold 0.5, because soft crashes now look like bag drops. Lowering the threshold to 0.2 gets it back to 0.96 and brings bag drops up to 0.39.
- `train.py` already folds all synthetic scenarios into the exported model. So the 0.97 bag drop rate in `out/results.md` describes fold models that never saw synthetic data, not the model on the website. The deployed recipe is closest to the "+ synthetic all scenarios" row.

## Recommendation

Ship gradient boosting trained on UMAFall plus all synthetic scenarios (as `train.py` already does for the export), add the 9 extra features, and drop the threshold from 0.5 to 0.2.

- Measured: UMAFall recall 0.981, 4 missed falls instead of 10, 19 false alarms instead of 15 (sweep). Nested cost check gives recall 0.986, FP 27, so expect somewhere in that range.
- Synthetic bag drop false alarms 0.39 instead of 0.98 for a model never trained on them.
- Export cost: no change to model size (200 trees, depth 3). The 9 features need porting to `web/src/lib/features.ts` with new parity vectors. They are short loops over the window (runs, moving average, angles), no FFT. If there is no time for the port, keep the 10 features and still lower the threshold. In the nested check that version had 35 false alarms instead of 27 for the same 2 to 3 missed falls.
- Report the bag drop number as a synthetic result and show the shifted figure next to it.

## Honest limits

- 19 subjects, 208 falls, phone in a trouser pocket, mostly simulated falls by volunteers. Not riders, not helmets, not Hong Kong roads.
- Every bag drop and set-down number comes from our generator. It shows the model learned what we put in, nothing more. Real bag drops and real rider crashes are needed, which is what the drop test rig is for.
- With 208 falls, one missed fall moves recall by 0.005. Most F1 differences here are within noise.
- MakingACall stays the worst false alarm (0.28 to 0.61 of those trials flagged depending on the variant). None of the new features fixed it.

## Files

- `common.py`: cached UMAFall windows, the 9 extra features, the synthetic split and the shifted bag drop.
- `run.py`: all variants. Writes `results.json` (full metrics, per-fold thresholds and tuned settings, false alarm rate per ADL) and `results_tables.md`.
- `sweep.py`: the threshold sweep above.

Extra feature names: `ff_s` (free fall run), `settle_s` (time to settle), `post1_std` (tumble in the first second), `rot_path_deg` (angle travelled by smoothed gravity, 2 s after impact), `n_peaks_2g`, `impact_w_s` (impact width), `rough_post` (post-impact roughness), `pre_act` (activity before), `peak2_ratio` (second peak over first).
