# Judges' guide: verify Metrics in five minutes

Metrics is a signed work-injury event record for delivery riders. A phone (and optionally a helmet clip) detects a likely crash, waits 30 seconds for the rider to cancel, then creates a record that dispatch, an insurer and the liable platforms can read. Everything below runs on the live site or from this repository. Nothing needs an account.

Live site: https://metricsfile.vercel.app
Repository: https://github.com/KarinaKKarinaK/imperial-hackathon

## What is real and what is simulated

| Real, running now | Simulated in this prototype |
|---|---|
| Your phone's accelerometer streamed to the server every 1.5 s | Platform orders and order ids (made up by the server) |
| Gradient boosting crash detector, the same model we evaluated | Insurance premiums and payouts (no insurer, no money) |
| Ed25519 signatures and a hash chain on every record | Hospital confirmation for tier two claims |
| Live Hong Kong Observatory reading for the heat band | The demo rider on `/demo` and its synthetic crash windows |
| Aggregate hazard cells and the Labour Department view | Triage profiles (from head-impact literature, not clinically validated) |

Not done yet, and listed as next steps in the README: helmet drop tests, running the helmet firmware on hardware, false alarms on real rides from our own riders, rider interviews. Research mode for collecting real riding data is built (opt-in on `/rider`, counts on `/labour`) but holds no data yet.

## Minute 1: the full pipeline on the demo

1. Open https://metricsfile.vercel.app/demo on a laptop. The 3D map needs WebGL; the panels work without it.
2. Under **Shift**, put the rider on shift.
3. Under **Feed the detector**, press **Pothole**, **Set down** and **Bag drop**. Each window goes through the real model. Note the probability shown: these should not create an event (bag drop sometimes does; that is a known limit).
4. Press **Crash**. An event opens with a 30 second cancel countdown. The dispatcher and underwriter panels update.
5. Wait 30 seconds. The status changes to paid. The payout is the central case of our model, HK$5,450 (see `docs/research/INSURANCE_MODEL.md`).

## Minute 2: your own phone

1. Open https://metricsfile.vercel.app/rider on your phone.
2. Read the consent screen, tap **I understand, continue**, allow motion access, then tap **On shift**.
3. Drop the phone onto a bed or cushion from about 40 cm. A countdown should appear. Tap to cancel, or let it run.
4. On a laptop, https://metricsfile.vercel.app/dispatch shows the alert. Other riders appear only with a short id and a position rounded to about 100 m.

Expect some false alarms when you take the phone out of a pocket: the phone-only detector raises about 10 per hour of everyday handling (see `ml/STREAMING.md`). The 30 second cancel and the helmet clip are the answers we propose.

## Minute 3: the record and its signature

- https://metricsfile.vercel.app/record walks through every field, including `activeJobs` and `apportionment`, the fields that split liability when a rider works for several apps.
- The schema is public JSON Schema:

```bash
curl -s https://metricsfile.vercel.app/api/schema | head -c 800
```

- The public key and the list of signed fields:

```bash
curl -s https://metricsfile.vercel.app/api/verify
```

- Each event links to a printable rider copy at `/r/<event id>` that shows whether its signature verifies.

## Minute 4: insurer and government views

- https://metricsfile.vercel.app/underwriter: what an insurer sees. Events only, never routes.
- https://metricsfile.vercel.app/labour: aggregates only, by time left on the delivery clock, travel mode, hour and heat band. Hazard cells appear only once a cell has at least 3 events.

```bash
curl -s https://metricsfile.vercel.app/api/labour
curl -s https://metricsfile.vercel.app/api/weather
```

The live store holds whatever visitors have created, so counts are small and are not evidence about real riders.

## Minute 5: check the numbers yourself

Detector results with 95% confidence intervals: `ml/out/results.md`. How we checked for leakage and what the numbers do not prove: `ml/VALIDITY.md`. False alarms per hour: `ml/STREAMING.md`.

```bash
git clone https://github.com/KarinaKKarinaK/imperial-hackathon
cd imperial-hackathon/web
pnpm install
pnpm test                 # detector, feature parity with Python, store and privacy rules

cd ../ml
pip install -r requirements.txt
mkdir -p data && curl -L -o data/umafall.zip https://ndownloader.figshare.com/files/43076140
unzip -q data/umafall.zip -d data/umafall
python3 test_pipeline.py  # pipeline checks
python3 audit.py          # recomputes every metric, shuffled-label leakage test
python3 stream_eval.py    # false alarms per hour, about 15 s
```

Headline: recall 0.933 [0.898, 0.963], precision 0.933 [0.898, 0.962], AUROC 0.992, five folds that hold out whole people. UMAFall falls are simulated by volunteers onto a mattress, so these numbers show the method works, not that it detects road crashes.

## Where each Imperial step lives

| Step | Open |
|---|---|
| Evidence base | `docs/research/EVIDENCE_TABLE.md`, `docs/research/MARKET_REFRAMING.md` |
| Design and build | `web/`, `ml/`, `firmware/`, `hardware/` |
| Validation and stress test | `ml/out/results.md`, `ml/VALIDITY.md`, `ml/STREAMING.md`, `validation/DROP_TEST_PROTOCOL.md` |
| Translation | `docs/research/INSURANCE_MODEL.md`, README business model and risk register |
| Ethics and governance | `docs/research/GOVERNANCE.md` |
