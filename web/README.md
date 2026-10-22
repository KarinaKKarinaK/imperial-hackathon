# Metrics web

Landing page, live demo and backend for the Metrics work-injury event record.

```
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # detector tests
pnpm build
```

Routes

| Path | What |
|---|---|
| / | Landing page |
| /demo | Live pipeline: 3D map, rider, sensor trace, dispatcher, underwriter |
| /rider | Phone client. Streams real accelerometer data to the API |
| /dispatch | Dispatcher view only |
| /underwriter | Underwriter view only |
| /record | The event record, field by field |
| /labour | Labour Department view: aggregates only, no rider ids |
| /r/[id] | A rider's signed copy of one record, printable, with verification code |
| /poster | Printable A0 poster with the STEMB map |

API

| Method and path | What |
|---|---|
| POST /api/telemetry | `{riderId, samples:[{t,ax,ay,az}], source?, phoneSamples?, pos?}`. Needs the rider key. Window must be in time order, 0.5 to 8 s, ending now. With `source: "helmet"` and `phoneSamples`, a crash needs both sensors within 1 s |
| GET /api/state?riderId= | Rider state, events, premium, route. Contact only with the rider key; other riders redacted and rounded to about 100 m |
| POST /api/sim | `{action: start|crash|ok|reset|rain|heat|platform|replay, value?}` scripted demo. `replay` feeds one synthetic scenario (riding, braking, pothole, set_down, bag_drop, crash) through the detector |
| POST /api/shift | `{riderId, onShift, platform?, secondApp?}`. Needs the rider key |
| POST /api/events/:id/cancel | Rider taps "I'm OK" inside the 30 second window. Owner's key only; 409 after the window |
| GET /api/weather | Hong Kong Observatory current reading and heat band |
| GET /api/schema | The record as JSON Schema, with the signing public key |
| GET /api/verify, POST /api/verify | Public key, and verification of a posted record |
| GET /api/events/:id | Rider export: record, signature, public key |
| POST /api/rider | `{riderId, deadlineMinutes?, emergencyContact?}`. Needs the rider key |
| GET /api/labour | Aggregates for the Labour Department: by delivery clock, mode, hour, heat, rain, multi-app count, hazard cells with at least 3 events |

## Rider key

The phone makes a random key once (`mf-rider-key` in local storage) and sends it as `x-rider-key` on every write. The first write claims the rider id and the server keeps only a sha256 of the key. Later writes, cancels and the rider's own contact need the same key. The demo and sample riders cannot be claimed.

## Signing

Every event's impact facts are signed with Ed25519 (`src/lib/sign.ts`), with keys sorted at every level so key order never matters. The facts include every app with an open order (`activeJobs`), the liability split (`apportionment`), which sensors agreed (`sources`) and `prevHash`, the sha256 of the rider's previous record, so a deleted or edited record breaks the chain. Once the outcome is final a second signature covers status, payment time and payout (`settlement`). `/api/verify` returns `valid`, `settlementValid` and, if the previous record is posted as `previous`, `chainValid`. Version 1 records still verify. The private key is `RECORD_SIGNING_KEY` in production (PKCS8 PEM, newlines as `\n`). Without it a per-process key is generated, which is fine locally. Generate a new key with:

```
node -e 'const {generateKeyPairSync}=require("crypto");console.log(generateKeyPairSync("ed25519").privateKey.export({type:"pkcs8",format:"pem"}))'
```

## Detector

`src/lib/detector.ts` runs the gradient boosting model exported from `../ml` (`src/lib/ml/model.json`). Features in `src/lib/features.ts` are a line-for-line port of `ml/features.py`; `features.test.ts` checks both against `ml/out/parity.json`. After retraining, copy `model.json`, `parity.json`, `demo_windows.json` and `results.json` from `ml/out` into `src/lib/ml` and run `pnpm test`.

## State

Upstash Redis through the Vercel Marketplace (`KV_REST_API_URL` and `KV_REST_API_TOKEN`). Every API request loads the store with its version, applies its change and saves with a compare-and-set script. If another request saved first, the handler reloads and runs again, so a cancel can never be overwritten by a telemetry post in flight. Riders idle for an hour with no events are pruned. Set `DEMO_KEY` to require `/demo?key=...` for the Reset button. Without the variables the store is in memory on one instance, which is fine for local work.

## Validate production

Careful: `pnpm start` reads `.env.production.local`, so a local production build with that file present writes to the live Redis store. Move the file aside before testing locally.

```
vercel env pull .env.production.local --environment production
python3 scripts/validate_prod.py .env.production.local
```

Checks persistence under 24 parallel requests, all six scenarios through the live detector, the event lifecycle including cancel, parity of the production model with the Python model on nine windows, the Observatory feed and input validation. Prints PASS or FAIL per check.
