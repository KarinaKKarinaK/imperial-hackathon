# Are the detector numbers real?

Independent checks of the pipeline in `train.py`, run on 22 Oct 2026. Reproduce with `python3 audit.py` from `ml/`.

## Verdict

The numbers are real and reproducible, and there is no leakage. Since this audit, `train.py` evaluates exactly the model that ships (UMAFall plus synthetic rider windows in every training fold) and scores synthetic scenarios on a fresh draw no model trains on. The task as measured, one pre-cut window per trial, is still easier than real riding.

## What holds

| Check | Result | Meaning |
|---|---|---|
| Recompute from `out/oof.csv` | Precision 0.933, recall 0.933, AUROC 0.992 (mined model) | Matches `results.md` exactly |
| Rerun CV from raw data | Same three numbers | Nothing stale or hand-edited |
| Shuffled labels, same CV | AUROC 0.47 to 0.51 over 5 runs | No leakage. The model learns from the signal, not the split |
| Folds | GroupKFold by subject, scaler fit inside each fold, threshold fixed at 0.5 before looking | No person in both train and test, no tuning on test |
| Recording length as a shortcut | AUROC 0.52. Window length 0.51 | Falls and daily activities are recorded the same way |
| Bootstrap by subject, not trial | Recall [0.898, 0.963], precision [0.896, 0.972], AUROC [0.987, 0.997] | A little wider than the per-trial CIs in `results.md` |
| Per person | Recall 0.67 for subject 7, 0.78 for subject 14, 0.89 or higher for the other 11 who fell | Performance varies by person |
| TypeScript port | `features.test.ts` passes against `parity.json` | The site runs the same model |

## Fixed on 22 Oct

1. **The shipped model was not the evaluated model.** The old table came from folds trained on UMAFall only (recall 0.952, precision 0.930). Folds now train like the export. Honest numbers then: recall 0.942, precision 0.903, AUROC 0.987 (before hard negative mining on 23 Oct).
2. **Synthetic results were partly in-sample.** The domain shift test and the site's replay buttons now use a fresh synthetic draw (seed 123). The model then flagged 22% of those bag drops and caught 88% of crashes.
3. **Copy that claimed drop tests** on the site, in the proposal and in the video script is corrected. No drop test has run yet.

## Still true

1. **One window per trial, cut around the biggest peak.** That is classification, not detection in a live stream. Falls are 33% of UMAFall trials. On the road they are rare, so precision there will be far lower. See Streaming below for false alarms per hour.
2. **The task is easier than a road crash.** Tilt angle alone reaches AUROC 0.91 and the old three-threshold rule reaches 0.975. Falls are simulated by volunteers onto a mattress, and only 13 of the 19 subjects performed falls.
3. **Synthetic data is our own model of the signal.** It tests the logic, not the world. Its bag drops differ from crashes mostly by impact size.
4. **Helmet clipping.** The MPU-6050 is set to 16 g, so helmet impact peaks above 16 g are capped.
5. **No drop tests yet.** `validation/runs/` is empty.

## Streaming

Measured on 23 Oct 2026 with the app's own loop (6 s window every 1.5 s, one event per 60 s), subject-held-out, threshold 0.5. Details in [STREAMING.md](STREAMING.md), reproduce with `python3 stream_eval.py`.

- Since 23 Oct the shipped model uses hard negative mining (`mining.py`): streaming windows of the training subjects' daily activities that score 0.2 or above become extra negatives, two rounds. In cross-validation only the fold's training subjects are mined. Audit checks 1, 5 and 6 above rerun with mining inside each fold: precision 0.933, recall 0.933, AUROC 0.992, shuffled labels 0.47 to 0.51.
- UMAFall full recordings, phone in pocket: **10.5 false alarms per hour** of daily activity [6.2, 16.5], down from 19.2 [13.2, 26.9] unmined. All of them are now from taking the phone out to make a call. Only 1.72 h of data.
- UMAFall falls in streaming mode: 200 of 208 caught (0.962), unmined 203. Median 2.07 s from impact to alarm, max 5.52 s.
- Synthetic 10 h ride (our generator): 0.20 false alarms per hour [0.02, 0.72], all bag drops. 21 of 25 crashes caught, unmined 23.
- Confirmation rules (2 of next 3 windows, or post-impact stillness) were measured and not shipped: the first loses too many falls, the second removes nothing once mining is on.
- The mining setting was chosen from four by looking at these held-out results.

False alarms per hour on real rides are still not measured. `stream_eval.py` reports them once `ml/data/field/` has ride segments.

## Fixes

- Measure false alarms per hour on real rides.
- Run the drop tests, and raise the range or add a high-g sensor for the helmet.
