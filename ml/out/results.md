# Crash detector results

UMAFall, phone sensor, 625 trials (208 falls), 19 subjects, 5-fold leave-subjects-out. Threshold 0.5. 95% bootstrap CIs.

| Model | Precision | Recall | F1 | AUROC | Brier |
|---|---|---|---|---|---|
| rule | 0.934 [0.884, 0.979] | 0.476 [0.411, 0.545] | 0.631 [0.568, 0.693] | 0.975 [0.963, 0.987] | 0.095 [0.083, 0.108] |
| logreg | 0.831 [0.778, 0.881] | 0.899 [0.855, 0.938] | 0.864 [0.826, 0.897] | 0.944 [0.925, 0.961] | 0.082 [0.065, 0.099] |
| gbm | 0.903 [0.864, 0.941] | 0.942 [0.911, 0.972] | 0.922 [0.897, 0.946] | 0.987 [0.978, 0.993] | 0.037 [0.026, 0.050] |
| mlp | 0.866 [0.821, 0.908] | 0.933 [0.897, 0.966] | 0.898 [0.867, 0.927] | 0.981 [0.971, 0.989] | 0.051 [0.037, 0.064] |
| cnn | 0.926 [0.885, 0.961] | 0.841 [0.791, 0.887] | 0.882 [0.845, 0.915] | 0.969 [0.953, 0.982] | 0.063 [0.047, 0.082] |

## Domain shift: synthetic rider set (never trained on)

| Model | Precision | Recall | AUROC | riding | braking | pothole | set_down | bag_drop | crash |
|---|---|---|---|---|---|---|---|---|---|
| rule | 0.498 | 1.000 | 0.910 | 0.00 | 0.00 | 0.00 | 0.01 | 1.00 | 1.00 |
| logreg | 0.553 | 0.980 | 0.975 | 0.00 | 0.00 | 0.00 | 0.00 | 0.79 | 0.98 |
| gbm | 0.800 | 0.880 | 0.989 | 0.00 | 0.00 | 0.00 | 0.00 | 0.22 | 0.88 |
| mlp | 0.755 | 0.947 | 0.987 | 0.00 | 0.00 | 0.00 | 0.00 | 0.31 | 0.95 |
| cnn | 0.805 | 0.827 | 0.978 | 0.00 | 0.00 | 0.00 | 0.00 | 0.20 | 0.83 |

Scenario columns show the fraction of windows flagged as a crash. Only the crash column should be high.


Exported model: gbm.


## Threshold sweep, gradient boosting (out-of-fold)

| Threshold | Precision | Recall | TP | FP | FN | TN |
|---|---|---|---|---|---|---|
| 0.2 | 0.879 | 0.981 | 204 | 28 | 4 | 389 |
| 0.3 | 0.891 | 0.981 | 204 | 25 | 4 | 392 |
| 0.4 | 0.898 | 0.971 | 202 | 23 | 6 | 394 |
| 0.5 | 0.903 | 0.942 | 196 | 21 | 12 | 396 |
| 0.6 | 0.923 | 0.928 | 193 | 16 | 15 | 401 |
| 0.7 | 0.931 | 0.909 | 189 | 14 | 19 | 403 |
| 0.8 | 0.930 | 0.889 | 185 | 14 | 23 | 403 |

## Failure table, UMAFall (out-of-fold)

- rule: most false alarms from MakingACall (15%), Aplausing (0%), Bending (0%); most misses on lateralFall (61%), backwardFall (55%), forwardFall (42%)
- logreg: most false alarms from MakingACall (54%), Hopping (17%), Jogging (11%); most misses on backwardFall (16%), lateralFall (11%), forwardFall (3%)
- gbm: most false alarms from MakingACall (43%), GoUpstairs (5%), Aplausing (0%); most misses on lateralFall (6%), forwardFall (6%), backwardFall (5%)
- mlp: most false alarms from MakingACall (48%), GoDownstairs (20%), GoUpstairs (5%); most misses on backwardFall (10%), lateralFall (9%), forwardFall (1%)
- cnn: most false alarms from MakingACall (13%), Hopping (11%), Jogging (7%); most misses on backwardFall (22%), forwardFall (21%), lateralFall (3%)
