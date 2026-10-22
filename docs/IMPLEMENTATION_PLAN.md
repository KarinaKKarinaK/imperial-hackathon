# Implementation plan

Deadline: 24 Oct 2026, 23:59 HKT (one day buffer before the stated 25 Oct). Today is 17 Oct. Seven working days.

Goal: a working end-to-end demo, drop test data, a poster with the STEMB map, and a video. Nothing else.

## What we build

```
helmet sensor (ESP32 + IMU) --BLE--> phone app (Expo) --HTTPS--> Supabase
                                          |                          |
                                   phone accel/gyro/GPS       detector (Python)
                                                                     |
                                              +----------------------+--------------------+
                                              |                      |                    |
                                       triage alert          insurance event       rider dashboard
                                       (dispatcher page)     (underwriter page)    (consent + own data)
```

Five parts. Each has one owner and one definition of done.

### 1. Helmet sensor (Hannes)
- ESP32 dev board, MPU-6050 or similar 6-axis IMU, LiPo, 3D-printed helmet clip.
- Streams accel and gyro at 100 Hz over BLE to the phone. If BLE is painful, log to SD and offload after the test. Phone-only fallback is fine for the demo.
- Done when: a drop produces a clean CSV of timestamped accel and gyro values.
- Build one. No PCB, no enclosure polish.

### 2. Phone app (Karina, Simone)
- Expo app. Reads phone accelerometer, gyroscope, GPS, and the helmet BLE stream.
- Buffers one-second windows and posts them to Supabase.
- Shows the rider: consent screen on first launch, a big "on shift" toggle, their own data, and a 30-second "I'm OK" cancel button after a detected crash.
- Done when: a shaken phone shows up as rows in Supabase within two seconds.
- Keep it to three screens. No login beyond a rider id.

### 3. Detector (Karina, Simone)
- Python script polling Supabase (or a Supabase edge function if that is quicker).
- Crash: peak resultant acceleration above threshold, then orientation change above 60 degrees, then near-zero motion for N seconds. Start with thresholds from the literature, then fit a small classifier (logistic regression or a tiny 1D CNN) on our own drop test data plus a public fall-detection dataset. Report precision, recall and a confusion matrix.
- Fatigue: rolling variance of speed and heading corrections plus continuous hours on shift. Heuristic score 0 to 1. Label it clearly as a heuristic.
- Heat: Hong Kong Observatory heat stress index for the rider's district plus shift duration. Three bands: green, amber, red.
- On crash: write a triage event (location, time, peak g, tilt, probable trauma profile) and an insurance event.
- Done when: a recorded drop triggers both events and a shaken-but-caught phone does not.

### 4. Dispatcher and underwriter pages (Simone, Alysa for the numbers)
- One static web page each, reading from Supabase.
- Dispatcher: map pin, time, trauma profile, rider contact. That is all.
- Underwriter: list of insured shifts, live premium per 20-minute window, triggered payouts. Premium = base rate x weather multiplier x heat band multiplier. Alysa supplies the base rate and multipliers with sources.
- Done when: a crash in the demo appears on both pages without a refresh.

### 5. Validation: drop tests (Hannes, Maalon for the injury thresholds)
- Rig: helmet with sensor, dropped from 0.5 m, 1.0 m, 1.5 m onto a flat surface, five drops each height. Plus non-crash controls: helmet carried, set down hard, dropped in a bag, phone shaken.
- Record peak g and orientation change per drop. Compare peak g against published head-injury thresholds (Maalon finds these).
- Output: a table of true positives, false positives, false negatives, with a 95% confidence interval on detection rate. One sentence on what the test does and does not prove (a flat drop is not a traffic collision).
- Done when: the CSVs and the table are in `/validation`.

## Research and writing (parallel to the build)

### Evidence base (Maalon, Hannes)
- Ten peer-reviewed sources minimum. Topics: delivery rider injury rates, helmet-mounted crash detection, fall detection with IMUs, fatigue from driving telemetry, heat stress in outdoor workers, parametric insurance, gig worker compensation.
- Use a simple PRISMA-style table: source, type, finding, how we use it.
- Hong Kong numbers: rider headcount, injury and death counts, the 2024 union survey (find the original, not a news summary), para 385 full text.

### Insurance mechanism (Alysa, Karina)
- Parametric trigger: verified crash event (detector confidence above X, rider on shift, no cancel within 30 seconds) pays a fixed amount within 24 hours. Secondary tier: hospital admission confirms a larger payout.
- Who pays: the platform, per delivery window. Show a worked example for one rider, one month.
- Multi-platform apportionment: the Jul 2026 HK proposal splits liability between platforms when a rider is on several apps at the time of injury. The event record must store which platform job was active at impact. Make this a field in the schema and a line on the underwriter page.
- Regulatory path: Hong Kong Insurance Authority, Insurtech Sandbox, who can underwrite (licensed insurer, we are the data and trigger provider, not the insurer). Read the Jul 2026 government proposal (LegCo reply 21 Jan 2026, RTHK 10 and 11 Jul 2026, Simmons and Simmons note).
- Financial model, two columns: Hong Kong pilot (about 15,000 riders, low single-digit HK$ millions a year) and one large-platform deployment (10 million riders, mainland or Southeast Asia). Build cost, cost per helmet unit, fee per insured rider per month, per-claim verification fee, break-even. One spreadsheet.
- Social return column: faster payouts, fewer contested claims, an objective record for fatal cases. This is what the hackathon scores.
- Risk register: top three barriers and the response to each. Include "mainland platforms will not buy from a HK team" with the insurer and reinsurer route as the mitigation.

### Data governance and consent (Maalon, Hannes)
Answer Imperial's fourth point head-on. One page, decided before the app is finished because it shapes the app.
- Consent: opt-in, per shift, revocable in the app. Plain language consent screen.
- Ownership: the rider owns their raw data. Platform and insurer get events only (crash yes or no, on shift yes or no, weather band). Never raw location history or a fatigue score.
- Cannot be used against the rider: no per-rider risk scores shared with platforms, no deactivation signals, no speed data sent upstream. Fatigue and heat alerts go to the rider only. Document this as a design rule, not a promise.
- PDPO (Hong Kong Personal Data (Privacy) Ordinance) mapping: purpose limitation, retention period, access rights.
- Dual-use risk: the same telemetry could become surveillance. Say so and show the technical controls.

### Failure modes and limits (whole team, written by Karina)
- Phone in a bag versus in a mount changes the signal.
- Flat drop tests are not collisions.
- Fatigue and heat scores are heuristics, not validated clinical measures.
- BLE drop-outs, battery, HK Observatory data granularity.
- Small sample sizes. Give the confidence intervals.

## Deliverables

| Deliverable | Owner | Done by |
|---|---|---|
| Live demo (shake helmet, see triage and payout) | Karina, Simone, Hannes | 22 Oct |
| Drop test CSVs and results table | Hannes, Maalon | 21 Oct |
| Evidence table (10+ sources) | Maalon, Hannes | 20 Oct |
| Insurance model spreadsheet and regulatory note | Alysa | 21 Oct |
| Data governance one-pager | Maalon, Hannes | 20 Oct |
| STEMB integration map (diagram + 50 words) | Alysa drafts, all review | 22 Oct |
| Scientific poster | Alysa layout, all content | 23 Oct |
| Video pitch | All. Script 19 Oct, shoot 22 Oct, cut 23 Oct | 23 Oct |
| Submission uploaded | Karina | 24 Oct |

## Schedule

| Day | Focus |
|---|---|
| Fri 17 Oct | Team meeting 17:30. Agree this plan. Hannes orders or sources parts today. Karina sets up Supabase project and repo. |
| Sat 18 | Expo app skeleton posting phone IMU to Supabase. Hannes wires sensor. Alysa starts insurance model. Maalon starts evidence table and injury thresholds. |
| Sun 19 | Detector v1 (thresholds) running on live phone data. Video script draft. Consent screen copy. |
| Mon 20 | Helmet sensor streaming. First drop tests. Evidence table and governance page done. |
| Tue 21 | Full drop test set. Fit classifier on the data. Dispatcher and underwriter pages. Insurance model done. |
| Wed 22 | End-to-end demo rehearsal. Shoot video. STEMB map. |
| Thu 23 | Poster. Cut video. Failure mode write-up. Freeze code. |
| Fri 24 | Final read-through against the Imperial five steps. Submit. |

Midterm conflicts this week: Hannes (weekend), Alysa (Friday 17th midterms done). Maalon has little time the week of 20 Oct, so the evidence and governance work front-loads to this weekend.

## Repo layout

```
web/            Next.js app, deployed at https://metricsfile.vercel.app
                landing page, /demo (3D map, phone, sensor trace, dispatcher, underwriter),
                /rider (real phone accelerometer client), /dispatch, /underwriter,
                API routes and the TypeScript detector with tests
ml/             detector training, UMAFall loader, synthetic generator, export
firmware/       ESP32 sketch and BLE protocol
hardware/       enclosure drawings and exploded view
validation/     drop test CSVs, results table, protocol
docs/           CONTEXT.md, this plan, briefing deck
  research/     evidence table, insurance model, governance, policy PDFs, judges
  submission/   poster, video plan and script, STEMB map
```

Status 20 Oct: records are signed with Ed25519 and verifiable at /api/verify, riders get a printable signed copy at /r/[id], the record carries the delivery countdown and travel mode, non-crash jolts aggregate into de-identified hazard cells on the map, the rider app has an order countdown, an emergency contact and one-tap 999 and SMS actions, real phones show on the demo map, a helmet Bluetooth client is ready for the clip, and GitHub runs the tests on every push.

Status 19 Oct, late: the web app, backend and detector are live. The detector is now a gradient boosting model trained on UMAFall (625 phone recordings, 19 subjects) plus synthetic rider windows: 95% recall, 93% precision, AUROC 0.994 leave-subjects-out, against 48% recall for the old rule. Results, parity tests and export are in ml/. The rider client sends GPS. Persistence is live on Upstash Redis and validated under parallel load. /record shows the standard. Firmware sketch, drop test protocol, governance page, evidence table, insurance model structure and the 150-word proposal are drafted. The phone client replaces the Expo app for the demo (browser DeviceMotion, no install). The Python detector is replaced by the TypeScript one in web/src/lib/detector.ts, which runs on the server and in the browser. Remaining build work is the helmet firmware and the drop tests.

## Decisions already made
- Stack: Expo (React Native), Supabase, Python for the detector, plain HTML for the two dashboards. Chosen for speed, not for production.
- Phone-only fallback is acceptable if the helmet sensor is not stable by 21 Oct. The helmet still appears in the video and the drop tests.
- No real rider data. All telemetry is from us. Say so in the poster.
- We are not the insurer. We provide the sensor, the trigger and the data standard.

## Open questions to close at the 17 Oct meeting
1. Exact submission format and file limits on the portal.
2. Video length and whether the poster is A0 PDF or slides.
3. Who has a 3D printer and an ESP32 on hand this weekend.
4. Did anyone get into the 15 Oct briefing, and is there a recording.
5. Date of the Grand Final.
