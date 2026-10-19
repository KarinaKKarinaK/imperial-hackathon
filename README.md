# MetricsFile

Imperial Global Hackathon Hong Kong and Macau 2026, University track, Challenge 6 (open challenge).

Hong Kong's 2026 Policy Address (para 385) promises statutory injury compensation for delivery platform workers. Platforms will carry the liability. Nobody has objective data on when and how riders get hurt, so claims cannot be verified and risk cannot be priced. A 2024 union survey found only 13% of injured riders were compensated.

We are building a verified work-injury event record: a low-cost helmet sensor and phone app that detect crashes and flag fatigue and heat risk, a triage alert for dispatchers, and a parametric micro-insurance trigger that pays out on a verified event. We are the sensor, the trigger and the data standard. We are not the insurer.

## Live

- Site and demo: https://metricsfile.vercel.app
- Live pipeline: https://metricsfile.vercel.app/demo
- Phone as sensor: https://metricsfile.vercel.app/rider

## Documents

| File | What it is |
|---|---|
| [CONTEXT.md](CONTEXT.md) | Hackathon rules, judging criteria, team, our idea, Imperial's feedback, business framing |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | What we build, who owns what, day-by-day schedule to 24 Oct |
| [submission/VIDEO_PLAN.md](submission/VIDEO_PLAN.md) | Beat sheet and production plan for the pitch video |
| [research/MARKET_REFRAMING.md](research/MARKET_REFRAMING.md) | Market sizing (HK, Macau, mainland), reframing options, business verdict, sources |
| [research/JUDGES.md](research/JUDGES.md) | Who the four judges are, what each will probe, how we answer |
| [submission/VIDEO_SCRIPT.md](submission/VIDEO_SCRIPT.md) | Shooting script, beat by beat |
| [web/README.md](web/README.md) | How to run the site, routes and API |

## Key dates

- 24 Oct 2026: internal deadline
- 25 Oct 2026, 23:59 HKT: submission deadline
- 14 Nov 2026: Grand Final, HKSTP Data Technology Hub, Tseung Kwan O

## Layout

```
web/            Next.js site: landing page, live demo, rider client, dispatcher and underwriter pages, API and detector
firmware/       ESP32 helmet sensor (to come)
validation/     drop test protocol, CSVs, results (to come)
research/       market, judges, evidence, insurance model, governance, policy PDFs
submission/     video plan and script, poster, STEMB map
```

## Writing rules

Plain language. Short sentences. Every number has a source. Say what the prototype proves and what it does not.
