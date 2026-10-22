# False alarms per hour of continuous use

`train.py` scores one 6 s window per trial, cut around the biggest peak. The app does something else, so this measures the detector the way the app runs it. Run on 23 Oct 2026. Reproduce with `python3 stream_eval.py` from `ml/` (about 15 s).

## Method

- **Same loop as the app.** The phone posts the last 6 s every 1.5 s (`web/src/app/rider/page.tsx`). Windows with under 10 samples or under 0.5 s of data are skipped, as in the app. The server opens at most one event per rider per 60 s (`ingest` in `web/src/lib/store.ts`). Each event is a 30 s cancel prompt for the rider.
- **Same model.** 5-fold GroupKFold by subject. Each fold trains exactly as `train.py` does: UMAFall peak windows of the training subjects plus the synthetic set (seed 7), same gradient boosting settings. No person is in both train and test.
- **UMAFall, full recordings.** Every phone recording of the held-out subjects is streamed end to end, not just the window around the peak. 625 recordings: 417 daily activities (1.72 h) and 208 falls (0.86 h). Every alarm on a daily activity is false. A fall is caught when an alarm window contains the biggest peak.
- **Synthetic ride.** Per fold, 2 hours of continuous riding from `synthetic.py`, fresh seeds 2026 to 2030, so 10 h in total. Events dropped in at these rates per hour: pothole 20, hard braking 12, phone set down 4 (then still 30 to 180 s), bag drop 1 (still 20 to 120 s), plus 5 crashes per run. The bag drop rate is deliberately high. Events that overlap are dropped. Placed over 10 h: 148 potholes, 78 brakes, 31 set downs, 8 bag drops, 25 crashes. **This is our own generator, not real riding.**
- Intervals: Poisson exact for rates, bootstrap over subjects (2000 resamples) for UMAFall, Wilson for synthetic crashes.

## Results

| | Threshold 0.5 (shipped) | Threshold 0.2 |
|---|---|---|
| UMAFall daily activities, false alarms per hour | **20.3** [14.2, 28.3] Poisson, [10.4, 27.6] by subject | 39.0 [30.2, 49.5], [25.2, 48.2] by subject |
| Daily activity recordings with an alarm | 35 of 417 | 67 of 417 |
| UMAFall falls caught, strict (alarm window holds the peak) | **201 of 208, 0.966** [0.938, 0.988] | 198 of 208, 0.952 [0.926, 0.982] |
| Fall recordings with any alarm | 205 of 208 | 207 of 208 |
| Impact to first alarm, median (p10, p90, max) | 0.88 s (0.23, 2.45, 4.95) | 0.77 s (0.19, 1.50, 4.42) |
| Synthetic ride, false alarms per hour | **0.30** [0.06, 0.88], 3 in 10 h | 0.40 [0.11, 1.02], 4 in 10 h |
| Synthetic crashes caught | 22 of 25 [0.70, 0.96] | 24 of 25 [0.80, 0.99] |
| Synthetic crash to alarm, median (max) | 1.25 s (4.65) | 1.25 s (5.53) |

Where the false alarms come from:

| Source | 0.5 | 0.2 |
|---|---|---|
| UMAFall: making a call (phone out of pocket) | 22 of 46 recordings | 27 of 46 |
| UMAFall: hopping | 7 of 53 | 18 of 53 |
| UMAFall: jogging | 3 of 28 | 5 of 28 |
| UMAFall: going downstairs | 2 of 20 | 11 of 20 |
| UMAFall: walking, upstairs | 1 of 83 | 6 of 83 |
| UMAFall: clapping, bending, hands up, opening a door | 0 of 187 | 0 of 187 |
| Synthetic: bag drop | 3 of 8 | 4 of 8 |
| Synthetic: pothole, braking, set down, plain riding | 0 of 257 events, 0 in 10 h | 0 |

The strict fall count misses 4 falls at 0.5 (9 at 0.2) where an alarm fired on a window ending 0.0 to 0.5 s before the biggest peak, which then held back the alarm on the peak for 60 s. Those alarms are almost certainly the fall itself, so 205 of 208 is the fairer figure. They are the same alarms counted as "extra" on fall recordings.

Lowering the threshold to 0.2 roughly doubles false alarms on daily activities and gains nothing on UMAFall falls. 0.5 stays.

## What this means

- With the phone in a pocket during daily life, the shipped model raises about 20 false alarms per hour of movement, mostly when the phone is taken out to make a call. Each one is a 30 s prompt the rider has to cancel. That is too many for a phone used off the bike.
- On our synthetic ride the rate is about 0.3 per hour, and every one is a bag drop. Potholes, braking and setting the phone down never fired. That number depends on how often we assume bags drop and on our model of the signal.

## Limits

- **Little ADL time.** UMAFall recordings are about 15 s each, so all daily activities add up to 1.72 h, of short, deliberate, often vigorous activity. That is not a shift. The rate per hour of an average day is likely lower, but we have not measured it.
- **Falls end the recording.** A fall recording stops a few seconds after impact, so later windows (with longer stillness) are never seen. The detection rate here is a floor for the streaming setup.
- **Synthetic ride is our model.** Event rates are our assumptions. Picking the phone back up is not modelled. Only 8 bag drops and 25 crashes, so the intervals are wide. An earlier draw with fewer bag drops gave 0.10 per hour and 25 of 25 crashes, which shows how much the small counts move.
- **Phone in a pocket, not on a rider.** Neither source is real riding. The open measurement is false alarms per hour on real shifts.
