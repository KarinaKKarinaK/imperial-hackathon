| Variant | Precision | Recall | F1 | AUROC | Brier | FP | FN | bag_drop | set_down | crash (syn) | bag_drop shifted |
|---|---|---|---|---|---|---|---|---|---|---|---|
| baseline (train.py evaluation, UMAFall only) | 0.930 [0.894, 0.960] | 0.952 [0.921, 0.980] | 0.941 [0.915, 0.963] | 0.994 [0.989, 0.997] | 0.032 | 15 | 10 | 0.98 | 0.01 | 0.99 | 0.98 |
| + extra features | 0.935 [0.902, 0.968] | 0.966 [0.941, 0.990] | 0.950 [0.929, 0.972] | 0.996 [0.994, 0.999] | 0.026 | 14 | 7 | 0.95 | 0.00 | 0.94 | 0.95 |
| + waist and chest windows | 0.886 [0.846, 0.926] | 0.976 [0.954, 0.995] | 0.929 [0.904, 0.952] | 0.994 [0.989, 0.997] | 0.037 | 26 | 5 | 1.00 | 0.02 | 1.00 | 1.00 |
| tuned (nested random search) | 0.938 [0.902, 0.967] | 0.952 [0.921, 0.981] | 0.945 [0.921, 0.968] | 0.989 [0.982, 0.996] | 0.033 | 13 | 10 | 0.98 | 0.01 | 0.99 | 0.96 |
| platt calibration | 0.933 [0.899, 0.964] | 0.942 [0.909, 0.972] | 0.938 [0.914, 0.960] | 0.983 [0.972, 0.992] | 0.034 | 14 | 12 | 0.97 | 0.01 | 0.99 | 0.96 |
| isotonic calibration | 0.918 [0.882, 0.952] | 0.966 [0.940, 0.990] | 0.941 [0.918, 0.963] | 0.989 [0.980, 0.995] | 0.032 | 18 | 7 | 0.97 | 0.01 | 0.99 | 0.98 |
| cost threshold 10:1 | 0.895 [0.857, 0.935] | 0.986 [0.968, 1.000] | 0.938 [0.915, 0.962] | 0.994 [0.989, 0.997] | 0.032 | 24 | 3 | 1.00 | 0.03 | 0.99 | 1.00 |
| + synthetic hard negatives | 0.926 [0.889, 0.960] | 0.962 [0.935, 0.985] | 0.943 [0.919, 0.964] | 0.990 [0.983, 0.995] | 0.032 | 16 | 8 | 0.16 | 0.00 | 0.86 | 0.68 |
| + synthetic all scenarios | 0.912 [0.873, 0.948] | 0.952 [0.921, 0.978] | 0.932 [0.905, 0.955] | 0.988 [0.980, 0.994] | 0.034 | 19 | 10 | 0.20 | 0.00 | 0.90 | 0.73 |
| + synthetic all + extra features | 0.930 [0.891, 0.963] | 0.957 [0.927, 0.981] | 0.943 [0.919, 0.965] | 0.996 [0.993, 0.998] | 0.027 | 15 | 9 | 0.19 | 0.00 | 0.87 | 0.70 |
| + synthetic all + cost threshold | 0.855 [0.811, 0.898] | 0.990 [0.976, 1.000] | 0.918 [0.891, 0.943] | 0.988 [0.980, 0.994] | 0.034 | 35 | 2 | 0.57 | 0.00 | 0.99 | 0.90 |
| + synthetic all + extra + cost | 0.884 [0.839, 0.926] | 0.986 [0.970, 1.000] | 0.932 [0.905, 0.957] | 0.996 [0.993, 0.998] | 0.027 | 27 | 3 | 0.45 | 0.00 | 0.98 | 0.90 |
| + synthetic all + tuned + cost | 0.854 [0.808, 0.897] | 0.986 [0.969, 1.000] | 0.915 [0.887, 0.941] | 0.988 [0.981, 0.994] | 0.038 | 35 | 3 | 0.63 | 0.01 | 1.00 | 0.91 |

| Variant | delta F1 95% CI | delta recall 95% CI | delta FP 95% CI | thresholds | MakingACall FP rate |
|---|---|---|---|---|---|
| + extra features | [-0.007, +0.029] | [-0.009, +0.040] | [-7, +4] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.30 |
| + waist and chest windows | [-0.031, +0.008] | [+0.000, +0.048] | [+4, +18] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.50 |
| tuned (nested random search) | [-0.008, +0.019] | [-0.023, +0.023] | [-5, +0] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.28 |
| platt calibration | [-0.011, +0.005] | [-0.026, +0.000] | [-3, +0] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.30 |
| isotonic calibration | [-0.009, +0.012] | [+0.000, +0.032] | [+0, +6] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.37 |
| cost threshold 10:1 | [-0.022, +0.015] | [+0.010, +0.059] | [+4, +15] | 0.15, 0.05, 0.15, 0.05, 0.05 | 0.48 |
| + synthetic hard negatives | [-0.018, +0.025] | [-0.023, +0.041] | [-5, +7] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.33 |
| + synthetic all scenarios | [-0.031, +0.011] | [-0.032, +0.030] | [-2, +10] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.39 |
| + synthetic all + extra features | [-0.020, +0.025] | [-0.028, +0.038] | [-6, +6] | 0.50, 0.50, 0.50, 0.50, 0.50 | 0.30 |
| + synthetic all + cost threshold | [-0.047, +0.002] | [+0.010, +0.068] | [+11, +29] | 0.20, 0.05, 0.10, 0.10, 0.05 | 0.61 |
| + synthetic all + extra + cost | [-0.032, +0.016] | [+0.005, +0.062] | [+4, +20] | 0.05, 0.25, 0.10, 0.15, 0.15 | 0.46 |
| + synthetic all + tuned + cost | [-0.050, -0.002] | [+0.009, +0.063] | [+12, +29] | 0.05, 0.05, 0.05, 0.05, 0.05 | 0.50 |

Tuned parameters per fold:
- tuned (nested random search): {"max_depth": 2, "learning_rate": 0.04, "max_iter": 200, "min_samples_leaf": 10, "l2_regularization": 0.0}; {"max_depth": 4, "learning_rate": 0.15, "max_iter": 400, "min_samples_leaf": 20, "l2_regularization": 0.0}; {"max_depth": 3, "learning_rate": 0.15, "max_iter": 400, "min_samples_leaf": 10, "l2_regularization": 1.0}; {"max_depth": 4, "learning_rate": 0.15, "max_iter": 200, "min_samples_leaf": 20, "l2_regularization": 0.0}; {"max_depth": 4, "learning_rate": 0.15, "max_iter": 200, "min_samples_leaf": 10, "l2_regularization": 0.0}
- + synthetic all + tuned + cost: {"max_depth": 2, "learning_rate": 0.08, "max_iter": 200, "min_samples_leaf": 40, "l2_regularization": 0.0}; {"max_depth": 4, "learning_rate": 0.15, "max_iter": 400, "min_samples_leaf": 20, "l2_regularization": 0.0}; {"max_depth": 4, "learning_rate": 0.15, "max_iter": 400, "min_samples_leaf": 40, "l2_regularization": 1.0}; {"max_depth": 2, "learning_rate": 0.15, "max_iter": 400, "min_samples_leaf": 10, "l2_regularization": 0.0}; {"max_depth": 4, "learning_rate": 0.08, "max_iter": 400, "min_samples_leaf": 10, "l2_regularization": 0.0}
