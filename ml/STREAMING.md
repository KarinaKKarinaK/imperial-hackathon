# False alarms per hour of continuous use

`train.py` scores one 6 s window per trial, cut around the biggest peak. The app does something else, so this measures the detector the way the app runs it. Run on 23 Oct 2026. Reproduce with `python3 stream_eval.py` from `ml/` (about 30 s). `python3 stream_eval.py --mine-rounds 0` gives the old, unmined model.

## Method

- **Same loop as the app.** The phone posts the last 6 s every 1.5 s (`web/src/app/rider/page.tsx`). Windows with under 10 samples or under 0.5 s of data are skipped, as in the app. The server opens at most one event per rider per 60 s (`ingest` in `web/src/lib/store.ts`). Each event is a 30 s cancel prompt for the rider.
- **Same model.** 5-fold GroupKFold by subject. Each fold trains exactly as `train.py` does: UMAFall peak windows of the training subjects plus the synthetic set (seed 7), same gradient boosting settings, plus hard negative mining (below). No person is in both train and test.
- **Hard negative mining** (`mining.py`, shipped since 23 Oct). The app's window is slid over every daily activity recording of the fold's training subjects. Windows the model scores at 0.2 or above are added as negatives and the model is refit. Two rounds. 62 to 101 windows are mined per fold, 83 for the export. Held-out subjects are never mined, scored for mining or used to pick a threshold.
- **UMAFall, full recordings.** Every phone recording of the held-out subjects is streamed end to end. 625 recordings: 417 daily activities (1.72 h) and 208 falls (0.86 h). Every alarm on a daily activity is false. A fall is caught when an alarm window contains the biggest peak.
- **Synthetic ride.** Per fold, 2 hours of continuous riding from `synthetic.py`, fresh seeds 2026 to 2030, 10 h in total, with 148 potholes, 78 hard brakes, 31 set downs, 8 bag drops and 25 crashes. The bag drop rate is deliberately high. **This is our own generator, not real riding.**
- **Confirmation rules** the app could add on top: an alarm needs a second positive window (2 of 2, or 2 of the next 3), or a window with `still_s` of 1 s or 2 s within the next 2 hops.
- **Field data.** If `ml/data/field/*.json` exist (gitignored, from the app), the shipped `out/model.json` is streamed over every ride segment for real false alarms per riding hour, and every labelled event is scored. Prints `no field data yet` otherwise.
- Intervals: Poisson exact for rates, Wilson for synthetic crashes.

## Results, threshold 0.5

Both columns come from the same code on the same windows. `stream_eval.py` now feeds the recordings to the model exactly as `train.py` does, so its fold models are the ones `train.py` scores. Before, it pre-sorted the samples, which changed some features slightly; that run gave 20.3 per hour for the unmined model, this one gives 19.2.

| | Unmined (before) | Mined (shipped) | Mined + 2 of next 3 | Unmined + still_s >= 1 s within 2 hops |
|---|---|---|---|---|
| UMAFall daily activities, false alarms per hour | 19.2 [13.2, 26.9] | **10.5** [6.2, 16.5] | 7.0 [3.6, 12.2] | 16.3 [10.8, 23.5] |
| UMAFall falls caught, streaming | 203 of 208 (0.976) | **200 of 208 (0.962)** | 184 of 208 (0.885) | 203 of 208 |
| Impact to alarm, median (p90, max) | 1.06 s (2.59, 4.41) | 2.07 s (3.25, 5.52) | 3.54 s (4.55, 7.00) | 2.58 s (3.54, 4.41) |
| Per trial, held-out subjects: precision, recall, AUROC | 0.903, 0.942, 0.987 | 0.933, 0.933, 0.992 | model as mined | model as unmined |
| Synthetic ride, false alarms per hour | 0.20 [0.02, 0.72] | 0.20 [0.02, 0.72] | 0.20 | 0.20 |
| Synthetic crashes caught | 23 of 25 | 21 of 25 | 20 of 25 | 23 of 25 |

Where the UMAFall false alarms come from, alarms per recordings:

| Activity | Unmined | Mined |
|---|---|---|
| Making a call (phone out of pocket) | 22 of 46 | 18 of 46 |
| Hopping | 8 of 53 | 0 |
| Going downstairs | 2 of 20 | 0 |
| Jogging | 1 of 28 | 0 |
| Everything else | 0 of 270 | 0 of 270 |

Other rules, measured: 2 of 2 consecutive gives 7.0 per hour and 182 of 208 falls on the mined model, 11.0 per hour and 195 of 208 on the unmined one. A `still_s` rule on the mined model changes nothing (10.5 per hour), because a phone held at the ear is also still. At threshold 0.2 the mined model gives 17.4 per hour, 205 of 208 falls and 25 of 25 synthetic crashes.

## What this means

- Mining removes every hopping, jogging and stairs alarm. False alarms on daily activity drop from 19.2 to 10.5 per hour, 45% fewer, while 200 of 208 falls are still caught. The intervals overlap, so treat the size of the drop as rough. With the old pre-sorted input the same comparison gave 20.3 to 12.8.
- All that is left is taking the phone out to make a call. The ten features cannot separate it: the model sees those windows as negatives and still scores some high. A feature for "phone ends up held upright at the ear" could, but it would lean on pocket orientation that a rider's phone does not share, so we did not add one.
- Confirmation rules cut false alarms a third further but lose 16 to 18 more falls, below the 95% we want. Not shipped. Time to alarm stays under 9 s in every variant, well inside the 30 s cancel window.
- Cost of mining: alarms come about 1 s later (median), and the synthetic ride catches 21 instead of 23 of 25 crashes. With 25 crashes that is within noise, but it is the wrong direction.

## Limits

- **Little ADL time.** All daily activities add up to 1.72 h of short, deliberate, often vigorous activity. Not a shift.
- **Variant picked on held-out results.** We compared four mining settings on these held-out subjects before choosing two rounds at 0.2. Training and mining never saw them, but the choice did.
- **Falls end the recording** a median 12 s after impact, so the detection rate is a floor.
- **Synthetic ride is our model.** Only 8 bag drops and 25 crashes, so the intervals are wide.
- **No real rides yet.** `stream_eval.py` will report false alarms per riding hour as soon as `ml/data/field/` has ride segments.
