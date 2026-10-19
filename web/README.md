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

API

| Method and path | What |
|---|---|
| POST /api/telemetry | `{riderId, samples:[{t,ax,ay,az}], pos?}`. Runs the detector, may create an event |
| GET /api/state?riderId= | Rider state, events, premium, route |
| POST /api/sim | `{action: start|crash|ok|reset|rain|heat|platform, value?}` scripted demo |
| POST /api/shift | `{riderId, onShift, platform?}` |
| POST /api/events/:id/cancel | Rider taps "I'm OK" inside the 30 second window |
| GET /api/weather | Hong Kong Observatory current reading and heat band |

State is held in memory on the server instance. Fine for a demo, swap for a database for a pilot.
