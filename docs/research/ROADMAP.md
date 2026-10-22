# Roadmap: better data, better model, ideas from other fields

Research and experiments from 22 Oct 2026. Measured model results are in `ml/experiments/RESULTS.md`. The checks on the current numbers are in `ml/VALIDITY.md`.

## Model: what the experiments showed

| Change | Effect, measured on held-out people | Ship? |
|---|---|---|
| Train on synthetic hard negatives (already in the exported model) | Synthetic bag drops flagged fall from 98% to 16 to 20%. No measurable change on UMAFall | Yes, keep |
| Nine extra window features | AUROC 0.994 to 0.996, Brier 0.032 to 0.027, F1 gain inside the noise | Yes, needs a port to `features.ts` and new parity vectors |
| Threshold 0.2 instead of 0.5 | Missed falls 9 to 4, false alarms 15 to 19. The 30 s cancel window makes a false alarm cheap | Yes |
| Hyperparameter tuning, Platt or isotonic calibration | No gain | No |
| Waist and chest sensor windows as extra data | 11 more false alarms | No |

Caveat: in our synthetic data bag drops differ from crashes mostly by impact size. When test bag drops hit as hard as crashes, 68 to 73% are flagged again. Real bag drops need real recordings.

## Data to add

No public dataset has a helmet IMU on a real two-wheeler crash. Open data can fill the missing negatives and give two-wheeler fall shapes. Helmet crash data we record ourselves.

| Dataset | Why | Access |
|---|---|---|
| Simulated Falls and ADL, Erciyes (UCI 455) | One sensor is on the head, like the clip | Open, CC BY 4.0 |
| FallAllD | Neck-worn, 238 Hz, accel and gyro | Free IEEE login |
| PTW falls, Boubezoul 2019 (doi 10.1016/j.dib.2019.103828) | The only open motorcycle fall data, plus hard braking and zigzags | Open, CC BY 4.0 |
| UPCT e-scooter falls (zenodo 14851613) | Tip-overs, collisions and road vibration on a two-wheeler | Open, CC BY 4.0 |
| CYCLEGYRO, UCL (doi 10.5522/04/28738931.v1) | Helmet gyro from 64 real London cyclists, as negatives | Open, CC BY 4.0 |
| SimRa Berlin | Real cycling vibration and rider-labelled near misses | CC BY-NC, fine for research only |
| TU Wien motorcyclist IMU | Real motorbike riding vibration | Open, CC BY 4.0 |
| DEKRA/ETS e-scooter kerb tests (doi 10.5683/SP3/ZUZMCM) | Dummy head acceleration with and without helmet, for triage bands | Open, CC BY 4.0 |

To collect ourselves: helmet drops on a headform from 0.5 to 2 m (front, side, back, ten each), helmet and phone controls (tossed on a seat, bag dropped with the phone inside), ten or more hours of Hong Kong riding logs with a tag button, and low-speed bicycle tip-overs on crash mats.

## Ideas from other fields

| Idea | From | What it changes here | Effort | Demo by 25 Oct |
|---|---|---|---|---|
| Two-station confirmation | Earthquake early warning (MyShake, Kong et al. 2016): cheap trigger on each phone, server confirms when several agree | Helmet and phone are two stations. A crash needs both within about 1 s, or the phone alone with speed above walking pace just before impact. A bag drop moves the phone, not the head | Days | Yes |
| Hash-chained records and device signing | Certificate Transparency and Sigstore Rekor; ESP32 hardware signing | Each record carries the hash of the one before, so nobody, us included, can backdate or delete one unseen. The clip signs its own frames, so the signature proves a device measured the crash, not only that our server wrote it | Hours to a day | Hash chain yes |
| Pre-trigger buffer and a high-g sensor | Car event data recorders (49 CFR 563, at least 5 s pre-crash), sports concussion mouthguards | Freeze 5 s before and after the trigger. An ADXL372 (up to 200 g, 1.4 uA while waiting) stops clipping at 16 g and lets the clip sleep until a hit | Hours, sensor 1 to 2 weeks | Buffer yes |
| Labels from rider confirmations | Weak supervision (Snorkel, Ratner et al. 2017) | A cancel tap is a noisy "no crash" label, silence plus a hospital record is a "crash" label. Real road data replaces simulated falls over time | Days | Logging yes |
| Rate-adjusted hazard cells | Disease mapping (Clayton and Kaldor 1987) | Divide jolts by rider passes per cell and shrink small cells toward the city mean, so busy roads do not look dangerous just for being busy | Hours | Yes |
| Basis risk number | Catastrophe bonds | State the payout gap per false alarm and per missed crash at the chosen threshold in the insurance model | Hours | Yes |
| Compact emergency message | EU eCall minimum set of data, 140 bytes | Fixed-size dispatcher alert that can go by SMS with no data signal | Hours | Yes |
| No individual premiums from event data | Usage-based car insurance: GM and OnStar data sales led to a five-year FTC ban | A governance rule that keeps rider trust | Hours | Yes |

Lesson from Apple crash detection: a wave of false emergency calls from ski slopes, 71 in one county in one weekend. A cancel window and two-sensor agreement are the answer.

## Known gaps in the current code

- Fixed 23 Oct: telemetry, shift, settings and cancel now need the rider's device key, so nobody can write for or cancel another rider. The record is still signed by our server, not by the device; clip-side signing is next.
- Fixed 23 Oct: with the helmet paired, a crash needs the helmet and the phone to agree within one second (`agree()` in `web/src/lib/store.ts`).
- Fixed 23 Oct: records carry `prevHash` and a signed `settlement`.
- Open: the MPU-6050 is set to 16 g, so helmet impacts above that are capped.
