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

API

| Method and path | What |
|---|---|
| POST /api/telemetry | `{riderId, samples:[{t,ax,ay,az}], pos?}`. Runs the detector, may create an event |
| GET /api/state?riderId= | Rider state, events, premium, route |
| POST /api/sim | `{action: start|crash|ok|reset|rain|heat|platform|replay, value?}` scripted demo. `replay` feeds one synthetic scenario (riding, braking, pothole, set_down, bag_drop, crash) through the detector |
| POST /api/shift | `{riderId, onShift, platform?}` |
| POST /api/events/:id/cancel | Rider taps "I'm OK" inside the 30 second window |
| GET /api/weather | Hong Kong Observatory current reading and heat band |

## Detector

`src/lib/detector.ts` runs the gradient boosting model exported from `../ml` (`src/lib/ml/model.json`). Features in `src/lib/features.ts` are a line-for-line port of `ml/features.py`; `features.test.ts` checks both against `ml/out/parity.json`. After retraining, copy `model.json`, `parity.json`, `demo_windows.json` and `results.json` from `ml/out` into `src/lib/ml` and run `pnpm test`.

## State

Upstash Redis through the Vercel Marketplace (`KV_REST_API_URL` and `KV_REST_API_TOKEN`). Every API request loads the store, applies its change and awaits the write before responding, so all instances agree. Without the variables the store is in memory on one instance, which is fine for local work.

## Validate production

```
vercel env pull .env.production.local --environment production
python3 scripts/validate_prod.py .env.production.local
```

Checks persistence under 24 parallel requests, all six scenarios through the live detector, the event lifecycle including cancel, parity of the production model with the Python model on nine windows, the Observatory feed and input validation. Prints PASS or FAIL per check.
