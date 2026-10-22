# Are the detector numbers real?

Independent checks of the pipeline in `train.py`, run on 22 Oct 2026. Reproduce with `python3 audit.py` from `ml/`.

## Verdict

The numbers are real and reproducible, and there is no leakage. Since this audit, `train.py` evaluates exactly the model that ships (UMAFall plus synthetic rider windows in every training fold) and scores synthetic scenarios on a fresh draw no model trains on. The task as measured, one pre-cut window per trial, is still easier than real riding.

## What holds

| Check | Result | Meaning |
|---|---|---|
| Recompute from `out/oof.csv` | Precision 0.903, recall 0.942, AUROC 0.987 | Matches `results.md` exactly |
| Rerun CV from raw data | Same three numbers | Nothing stale or hand-edited |
| Shuffled labels, same CV | AUROC 0.47 to 0.54 over 5 runs | No leakage. The model learns from the signal, not the split |
| Folds | GroupKFold by subject, scaler fit inside each fold, threshold fixed at 0.5 before looking | No person in both train and test, no tuning on test |
| Recording length as a shortcut | AUROC 0.52. Window length 0.51 | Falls and daily activities are recorded the same way |
| Bootstrap by subject, not trial | Recall [0.898, 0.971], precision [0.864, 0.953], AUROC [0.979, 0.996] | A little wider than the per-trial CIs in `results.md` |
| Per person | Recall 0.67 for subjects 7 and 16, 0.89 or higher for the other 11 who fell | Performance varies by person |
| TypeScript port | `features.test.ts` passes against `parity.json` | The site runs the same model |

## Fixed on 22 Oct

1. **The shipped model was not the evaluated model.** The old table came from folds trained on UMAFall only (recall 0.952, precision 0.930). Folds now train like the export. Honest numbers: recall 0.942, precision 0.903, AUROC 0.987.
2. **Synthetic results were partly in-sample.** The domain shift test and the site's replay buttons now use a fresh synthetic draw (seed 123). The shipped model flags 22% of those bag drops and catches 88% of crashes.
3. **Copy that claimed drop tests** on the site, in the proposal and in the video script is corrected. No drop test has run yet.

## Still true

1. **One window per trial, cut around the biggest peak.** That is classification, not detection in a live stream. Falls are 33% of UMAFall trials. On the road they are rare, so precision there will be far lower. See Streaming below for false alarms per hour.
2. **The task is easier than a road crash.** Tilt angle alone reaches AUROC 0.91 and the old three-threshold rule reaches 0.975. Falls are simulated by volunteers onto a mattress, and only 13 of the 19 subjects performed falls.
3. **Synthetic data is our own model of the signal.** It tests the logic, not the world. Its bag drops differ from crashes mostly by impact size.
4. **Helmet clipping.** The MPU-6050 is set to 16 g, so helmet impact peaks above 16 g are capped.
5. **No drop tests yet.** `validation/runs/` is empty.

## Streaming

Measured on 23 Oct 2026 with the app's own loop (6 s window every 1.5 s, one event per 60 s), subject-held-out, threshold 0.5. Details in [STREAMING.md](STREAMING.md), reproduce with `python3 stream_eval.py`.

- UMAFall full recordings, phone in pocket: **20.3 false alarms per hour** of daily activity [14.2, 28.3], most from taking the phone out to make a call. Only 1.72 h of data.
- UMAFall falls in streaming mode: 201 of 208 caught strictly (0.966), 205 of 208 with an alarm. Median 0.88 s from impact to alarm.
- Synthetic 10 h ride (our generator): 0.30 false alarms per hour [0.06, 0.88], all bag drops. 22 of 25 crashes caught.
- Threshold 0.2 doubles UMAFall false alarms (39.0 per hour) for no gain on falls.

False alarms per hour on real rides are still not measured.

## Fixes

- Measure false alarms per hour on real rides.
- Run the drop tests, and raise the range or add a high-g sensor for the helmet.
