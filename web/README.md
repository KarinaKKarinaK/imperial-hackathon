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

In memory on the server instance by default. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (Vercel Marketplace, Upstash Redis) and the store persists across cold starts and instances with no code change.
