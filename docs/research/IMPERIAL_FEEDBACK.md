# Response to Imperial's feedback on our problem statement

Imperial's reply to our 2 October 2026 problem statement raised four points. This page says what we did about each, with the evidence. It also corrects one statistic.

## 1. STEMB coverage

| Pillar | Team member | What they own in the build |
|---|---|---|
| Engineering | Karina Kalicka-Molin | Crash detector, validation, data pipeline |
| Engineering | Simone Copetti | Rider app, backend, signing and verification |
| Natural sciences | Hannes Ganske | Helmet sensor, enclosure, firmware, drop test protocol |
| Medicine and health | Maalon Jochmann | Triage note, occupational health framing, consent and ethics |
| Business | Alysa de Haas | Insurance mechanism, financial model, regulatory pathway |

All four pillars are covered, more than the three the university track requires. In the video each person speaks only on their own field.

## 2. Prototype and validation

- A working prototype runs live at https://metricsfile.vercel.app: the rider app turns a phone into the sensor, and a crash flows to dispatch, the insurer view and a signed record. It can be demonstrated live on Grand Final day from any phone.
- Validation done: the detector is tested on people it never saw (precision 93%, recall 93%, AUROC 0.992, 95% intervals), checked for leakage with shuffled labels, run in the same live loop as the app (10.5 false alarms an hour of everyday phone handling), and run on 1,865 hours of public real riding data (0.2 false alarms an hour of motorbike riding). See `ml/VALIDITY.md`, `ml/STREAMING.md`, `ml/PUBLIC_RIDES.md`.
- Drop tests: the protocol is written (`validation/DROP_TEST_PROTOCOL.md`) and the training code already loads the results. The helmet runs are planned before the Grand Final. We have not run them yet and say so everywhere.

## 3. The insurance mechanism

- How data feeds the trigger, the parametric conditions, the money and the Hong Kong regulatory pathway are in `INSURANCE_MODEL.md`. In short: a licensed insurer writes fixed-sum accident cover (Cap 41, Class 1) and the platform's liability cover; Metrics supplies the signed event that triggers tier one; tier one adds to statutory compensation and never replaces it (ECO s31); the pilot route is the Insurance Authority's Insurtech Sandbox with an insurer as lead and Metrics as technology partner.
- Every money figure now comes from sourced inputs with a low, central and high range: tier one HK$5,450 (half a month of average rider income, Labour Department survey), premium about HK$85 a rider a month, Hong Kong pilot revenue about HK$0.66m a year (range HK$0.08m to HK$10.1m).
- No insurer has signed with us yet. That is the next step.

## 4. Data privacy and worker consent

How workers consent, who owns the data, and how the system cannot be used against them. Full detail in `GOVERNANCE.md`; this table maps the design to the six data protection principles of the Personal Data (Privacy) Ordinance (Cap 486) and to cases where worker data was used against workers.

| Design rule | Enforced in code | PDPO principle | What it prevents |
|---|---|---|---|
| Consent screen first, in English, Traditional Chinese, Nepali and Urdu; opt in per shift; nothing read off shift | `/rider` consent; telemetry ignored off shift | DPP1 purpose and collection | Riders tracked off shift (the Italian regulator's 2021 fines against Glovo's Foodinho and Deliveroo, reported) |
| Only 6 second windows are checked and then discarded; no route history; latest position only | `ingest` in `web/src/lib/store.ts` | DPP1 "adequate but not excessive", DPP2 retention | Continuous location tracking |
| No risk score, no deactivation signal, event data never sets an individual's premium | Nothing in the schema can hold one | DPP3 use only for the stated purpose | Data sold on to raise premiums (US FTC order against General Motors, Jan 2026, reported) |
| Each phone holds a key; only it can write for its rider, cancel its events or read its contact; records are signed | `authorizeRider`, `sign.ts` | DPP4 security | Others cancelling a rider's crash or editing a record |
| Governance rules are public | `GOVERNANCE.md`, `/record` | DPP5 openness | Hidden rules |
| The rider gets a signed copy of every record and can read every field | `/r/[id]`, `/api/events/:id` | DPP6 access | Riders unable to see the data used about them (Amsterdam Court of Appeal, Uber and Ola, Apr 2023, reported) |
| Platforms see only events they are liable for; government sees totals only | Redacted views, `/labour` | DPP3, DPP4 | Platforms watching riders |
| Research data is a separate opt-in, has no rider id or position, and is deleted when the rider turns it off | `/api/field`, `withdrawResearch` | DPP1, DPP2, DPP3 | Training data kept against the rider's wishes |
| A human dispatcher and a human insurer act on the event; the model never decides alone | Dispatcher and insurer views | PCPD AI framework (2024): human oversight in line with risk | Automated decisions with only symbolic human review |

What is planned, not built: deleting event records after the claims limitation period, and an access log per reading party. Both are listed as next steps in the README.

## Correction: the 13% figure

Our problem statement cited "a 2024 union survey found only 13% of injured riders compensated", and Imperial's reply called it a well-chosen data point. We could not trace its original source, so we dropped it. We now cite a sourced figure instead: in a Hong Kong Federation of Trade Unions survey of 168 riders (July to August 2021, reported in The Standard on 24 August 2021), 22 had been injured on delivery and only 2 were compensated by the platform.
