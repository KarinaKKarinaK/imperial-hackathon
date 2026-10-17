# MetricsFile

Imperial Global Hackathon Hong Kong and Macau 2026, University track, Challenge 6 (open challenge).

Hong Kong's 2026 Policy Address (para 385) promises statutory injury compensation for delivery platform workers. Platforms will carry the liability. Nobody has objective data on when and how riders get hurt, so claims cannot be verified and risk cannot be priced. A 2024 union survey found only 13% of injured riders were compensated.

We are building a verified work-injury event record: a low-cost helmet sensor and phone app that detect crashes and flag fatigue and heat risk, a triage alert for dispatchers, and a parametric micro-insurance trigger that pays out on a verified event. We are the sensor, the trigger and the data standard. We are not the insurer.

## Documents

| File | What it is |
|---|---|
| [CONTEXT.md](CONTEXT.md) | Hackathon rules, judging criteria, team, our idea, Imperial's feedback, business framing |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | What we build, who owns what, day-by-day schedule to 24 Oct |
| [submission/VIDEO_PLAN.md](submission/VIDEO_PLAN.md) | Beat sheet and production plan for the pitch video |
| [research/MARKET_REFRAMING.md](research/MARKET_REFRAMING.md) | Market sizing (HK, Macau, mainland), reframing options, business verdict, sources |

## Team

| Name | Pillar | Role |
|---|---|---|
| Karina Kalicka-Molin | Engineering | Lead, ML, software |
| Simone Copetti | Engineering | ML, software |
| Hannes Ganske | Natural sciences | Hardware, drop tests, legal research |
| Maalon Jochmann | Medicine and health | Trauma triage, evidence base, data governance |
| Alysa de Haas | Business | Insurance mechanism, financial model, poster |

## Key dates

- 24 Oct 2026: internal deadline
- 25 Oct 2026, 23:59 HKT: submission deadline
- Grand Final: date to be confirmed

## Planned layout

```
app/            Expo app (phone sensors, BLE to helmet, consent screen)
detector/       Python crash, fatigue and heat detection, evaluation
firmware/       ESP32 helmet sensor
web/            dispatcher and underwriter pages
validation/     drop test protocol, CSVs, results
research/       evidence table, insurance model, governance, policy PDFs
submission/     poster, video, STEMB map
```

## Writing rules

Plain language. Short sentences. Every number has a source. Say what the prototype proves and what it does not.
