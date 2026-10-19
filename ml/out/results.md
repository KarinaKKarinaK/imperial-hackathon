# Crash detector results

UMAFall, phone sensor, 625 trials (208 falls), 19 subjects, 5-fold leave-subjects-out. Threshold 0.5. 95% bootstrap CIs.

| Model | Precision | Recall | F1 | AUROC | Brier |
|---|---|---|---|---|---|
| rule | 0.934 [0.884, 0.979] | 0.476 [0.411, 0.545] | 0.631 [0.568, 0.693] | 0.975 [0.963, 0.987] | 0.095 [0.083, 0.108] |
| logreg | 0.835 [0.788, 0.881] | 0.976 [0.955, 0.995] | 0.900 [0.871, 0.929] | 0.970 [0.958, 0.982] | 0.056 [0.043, 0.070] |
| gbm | 0.930 [0.894, 0.960] | 0.952 [0.921, 0.980] | 0.941 [0.915, 0.963] | 0.994 [0.989, 0.997] | 0.032 [0.020, 0.044] |
| mlp | 0.884 [0.841, 0.923] | 0.957 [0.926, 0.985] | 0.919 [0.892, 0.945] | 0.987 [0.979, 0.993] | 0.041 [0.028, 0.054] |
| cnn | 0.943 [0.910, 0.975] | 0.880 [0.833, 0.920] | 0.910 [0.880, 0.940] | 0.988 [0.979, 0.995] | 0.044 [0.031, 0.059] |

## Domain shift: synthetic rider set (never trained on)

| Model | Precision | Recall | AUROC | riding | braking | pothole | set_down | bag_drop | crash |
|---|---|---|---|---|---|---|---|---|---|
| rule | 0.493 | 1.000 | 0.916 | 0.00 | 0.00 | 0.00 | 0.04 | 0.99 | 1.00 |
| logreg | 0.402 | 1.000 | 0.988 | 0.00 | 0.00 | 0.05 | 0.43 | 1.00 | 1.00 |
| gbm | 0.505 | 0.987 | 0.902 | 0.00 | 0.00 | 0.00 | 0.00 | 0.97 | 0.99 |
| mlp | 0.450 | 0.953 | 0.842 | 0.00 | 0.00 | 0.19 | 0.00 | 0.98 | 0.95 |
| cnn | 0.197 | 1.000 | 0.949 | 0.10 | 0.99 | 1.00 | 1.00 | 1.00 | 1.00 |

Scenario columns show the fraction of windows flagged as a crash. Only the crash column should be high.


Exported model: gbm.


## Failure table, UMAFall (out-of-fold)

- rule: most false alarms from MakingACall (15%), Aplausing (0%), Bending (0%); most misses on lateralFall (61%), backwardFall (55%), forwardFall (42%)
- logreg: most false alarms from MakingACall (74%), GoUpstairs (10%), Hopping (4%); most misses on lateralFall (5%), forwardFall (1%), backwardFall (1%)
- gbm: most false alarms from MakingACall (33%), Aplausing (0%), Bending (0%); most misses on lateralFall (8%), forwardFall (6%), backwardFall (1%)
- mlp: most false alarms from MakingACall (52%), GoUpstairs (5%), Bending (2%); most misses on lateralFall (8%), forwardFall (3%), backwardFall (3%)
- cnn: most false alarms from MakingACall (9%), Walking (5%), Hopping (4%); most misses on forwardFall (15%), backwardFall (14%), lateralFall (6%)
