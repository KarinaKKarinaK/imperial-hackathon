# Are the detector numbers real?

Independent checks of the pipeline in `train.py`, run on 22 Oct 2026. Reproduce with `python3 audit.py` from `ml/`.

## Verdict

The headline numbers are real and reproducible, and there is no leakage. But they describe the evaluation model, trained on UMAFall alone. The model that ships is also trained on our synthetic rider windows, and it scores a little lower. The task as measured, one pre-cut window per trial, is easier than real riding.

## What holds

| Check | Result | Meaning |
|---|---|---|
| Recompute from `out/oof.csv` | Precision 0.930, recall 0.952, AUROC 0.994 | Matches `results.md` exactly |
| Rerun CV from raw data | Same three numbers | Nothing stale or hand-edited |
| Shuffled labels, same CV | AUROC 0.48 to 0.55 over 5 runs | No leakage. The model learns from the signal, not the split |
| Folds | GroupKFold by subject, scaler fit inside each fold, threshold fixed at 0.5 before looking | No person in both train and test, no tuning on test |
| Recording length as a shortcut | AUROC 0.52. Window length 0.51 | Falls and daily activities are recorded the same way |
| Bootstrap by subject, not trial | Recall [0.931, 0.981], precision [0.896, 0.966], AUROC [0.990, 0.998] | About as wide as the published per-trial CIs |
| TypeScript port | `features.test.ts` passes against `parity.json` | The site runs the same model |

## What needs saying out loud

1. **The shipped model is not the evaluated model.** `train.py` reports cross-validation of models trained on UMAFall only, then exports a model trained on UMAFall plus 900 synthetic windows. The same recipe, cross-validated on held-out UMAFall subjects, scores recall 0.942, precision 0.903, AUROC 0.987.
2. **Synthetic results for the shipped model are in-sample.** It was trained on those windows, so it flags 7% of bag drops there. On a fresh synthetic draw (seed 123) it flags 25% of bag drops and catches 88% of crashes. The UMAFall-only model catches 94% of crashes on the same draw but flags 99% of bag drops. The site's replay buttons use windows from the training set.
3. **One window per trial, cut around the biggest peak.** That is classification, not detection in a live stream. Falls are 33% of UMAFall trials. On the road they are rare, so precision there will be far lower than 93%. False alarms per riding hour have not been measured.
4. **The task is easier than a road crash.** Tilt angle alone reaches AUROC 0.91 and the old three-threshold rule reaches 0.975. Falls are simulated by volunteers onto a mattress, and only 13 of the 19 subjects performed falls.
5. **Synthetic data is our own model of the signal.** It tests the logic, not the world.
6. **Helmet clipping.** The MPU-6050 is set to 16 g, so helmet impact peaks above 16 g are capped. The 25 g crash in the README is a synthetic phone window.
7. **No drop tests yet.** `validation/runs/` is empty. Copy that says the model is trained on our drop tests is not true yet.

## Fixes

- Report the shipped recipe's numbers, or ship the UMAFall-only model, so the headline and the site match the model that runs.
- Evaluate synthetic scenarios on a held-out seed, never on training windows. Use a held-out draw for the replay buttons.
- Measure false alarms per hour on continuous recordings (UMAFall full trials with a sliding window, then real rides).
- Run the drop tests, and raise the range or add a high-g sensor for the helmet.
