# Video script

Metrics, Team Metrics. Imperial Global Hackathon Hong Kong and Macau 2026, Challenge 6.

Hard limit 4:30. Target 4:23. English. Burned-in subtitles on every spoken line. Every member speaks at least twice.

## Structure

| Part | Time | What | Judges' criteria it serves |
|---|---|---|---|
| 1. Intro clips | 0:00 to 0:20 | Street footage and big type. The human cost and the policy anchor | Problem identification, potential impact |
| 2. How it works | 0:20 to 1:20 | Team relay, one line each: the gap, the idea, how it works | Problem identification, creativity, interdisciplinarity |
| 3. The market | 1:20 to 1:50 | Who pays, why now, how big | Feasibility, translation, impact |
| 4. Screen recording | 1:50 to 3:05 | The real app, start to finish, one narrator | Design and build, innovation, validation |
| 5. Split screen | 3:05 to 3:30 | Same crash, today versus with the record | Impact, social return |
| 6. Risks and next steps | 3:30 to 4:15 | Team relay: limits, top three risks and fixes, ethics, what comes next | Validation, risk register, ethics, research integrity |
| 7. End card | 4:15 to 4:23 | Team, quote, live URL | Teamwork |

Rules for the edit:
- Every number on screen has a source line in the corner. Anything modelled or targeted says so on screen.
- Synthetic data is captioned "synthetic" wherever it appears.
- No line longer than nine seconds in the relays. Cut on every line.
- No music swell over the problem lines. No smiling on the problem lines.

## Part 1. Intro clips (0:00 to 0:20)

Sound: rain, an order notification, a skid, silence. Footage cuts every 2 seconds: riders in rain, a phone mount with two delivery apps, a helmet on a seat, a hospital corridor (our own footage or licensed stock). White type over each cut. No voice.

If rider interviews are recorded before the shoot, replace 0:00 to 0:04 with four seconds of a rider's own voice, subtitled.

| Time | On screen | Source corner |
|---|---|---|
| 0:00 | HONG KONG RUNS ON TWO WHEELS. | |
| 0:02 | 12,900 delivery platform workers. Zero employers. | C&SD Thematic Household Survey No. 81 |
| 0:05 | 2 of 22 injured riders compensated by the platform. | HKFTU survey of 168 riders, 2021 |
| 0:08 | One typhoon. One rider. Five years in court. | HK High Court, Sep 2025 |
| 0:11 | "Statutory compensation for injuries at work." | 2026 Policy Address, para 385 |
| 0:15 | Platforms will pay. For what? | |
| 0:18 | NO RECORD. NO PROOF. NO PRICE. | |

Hard cut to Part 2.

## Part 2. How it works (0:20 to 1:20)

One speaker per line, into the lens, a different location each time. Lower third with name and pillar on first appearance only.

| # | Speaker | Line | Location | Seconds |
|---|---|---|---|---|
| 1 | Maalon | When a rider crashes in Hong Kong today, nothing records it. Not the time, not the impact, not the app. | Road crossing, traffic behind | 6 |
| 2 | Alysa | The new law makes platforms pay. A third of riders work two apps at once. So who pays? | Food court pick-up counters | 6 |
| 3 | Maalon | Nobody can say without evidence. That is an occupational health gap, and no other challenge covers it. | Hospital or clinic entrance | 6 |
| 4 | Simone | So we built the record. The rider's own phone is the sensor. | Holding a phone on /rider, "On shift" lit | 4 |
| 5 | Hannes | On a motorbike, a helmet clip adds crash-grade data, for about a hundred and ten Hong Kong dollars. | 3D printer, clip and ESP32 in hand | 6 |
| 6 | Karina | A model trained on public fall data spots the crash. The rider has thirty seconds to cancel. | Phone countdown on screen | 5 |
| 7 | Maalon | No answer, and dispatch gets the location and the likely injury, in the order a 999 call taker asks. | Dispatcher console on a laptop | 6 |
| 8 | Alysa | That event becomes a signed record naming every app the rider was on. The payout, and the split between platforms, become a lookup. | Whiteboard, two logos, one split arrow | 7 |
| 9 | Hannes | Four disciplines: the sensors, the model, the triage and the law, and the money. | Whole team at one table, quick pan | 5 |

About 155 words, 60 seconds at relay pace.

## Part 3. The market (1:20 to 1:50)

Alysa to camera, intercut with full-screen cards. Source corner on every card.

| Time | Alysa | Card |
|---|---|---|
| 1:20 | "The law creates the buyer: platforms carry the liability, and insurers need data to price it." | "No-fault. Platforms liable. Split across apps." Source: Labour and Welfare Bureau proposal, Jul 2026 |
| 1:28 | "Hong Kong is the proving ground: thirteen thousand riders and a law being written now." | "HK: 12,900 riders. 41,254 work injury claims a year." Sources: C&SD No. 81; Labour Department 2024 |
| 1:35 | "The market is next door. China's scheme already covers twelve million riders, with flat premiums and claims checked by hand. Singapore made cover compulsory in 2025." | Bar chart: 12.3M mainland riders covered, 14 platforms, Meituan over 3bn yuan paid in. Sources: Asia Insurance Review; China Daily; Singapore MOM |
| 1:44 | "Platforms and insurers pay per rider and per verified event. Riders never pay. We are not the insurer. We are the evidence." | "Revenue: per rider per month plus per verified event. Hong Kong pilot: low single-digit HK$ millions a year [modelled]." |

About 80 words, 30 seconds.

## Part 4. Screen recording (1:50 to 3:05)

One continuous story on the live site, cut tight. Voice over only, each part read by the person who owns it. Phone shots are screen recordings from a real phone. Laptop shots at 1440 by 900, cursor visible, no browser chrome.

| Time | Screen | Voice over |
|---|---|---|
| 1:50 | Phone, metricsfile.vercel.app/rider. Consent screen, tap 中文 to show Cantonese, back to English, tap continue | Simone: "This is the rider's app, in English, Cantonese, Nepali and Urdu. Consent comes first." |
| 1:57 | Allow motion, tap On shift. Live sensor trace moving | Simone: "On shift, the phone streams its motion. Off shift, nothing is read." |
| 2:02 | Drop the phone onto a cushion. The 30 second countdown and the large I'm OK button appear | Simone: "A drop like a fall. Thirty seconds to cancel, with a button you can hit wearing gloves." |
| 2:09 | Laptop, /demo. Second app toggle on. Press Crash under Feed the detector. Sensor panel spikes, probability readout. Caption: "Demo rider, synthetic crash window" | Karina: "On the full demo, the rider has orders open on two apps. The model reads the crash." |
| 2:18 | Dispatcher card slides in. Hover "Copy for 999" | Maalon: "Dispatch sees what happened, where, the likely injury and how to reach the rider." |
| 2:25 | Let the 30 s run out. Underwriter panel: Paid, HK$8,000, split 50 and 50 between Platform A and B, "Settlement verified". Caption: "Placeholder amounts" | Alysa: "No answer, so tier one pays, split across both apps." |
| 2:35 | /r/EVT-... rider's signed copy: open orders, the split, "Signature verified", claim block with the one-year deadline | Simone: "The rider gets a signed copy they own, with a claim reference and the deadline." |
| 2:43 | Terminal beside the browser: POST the record to /api/verify, "valid": true. Change payoutHkd to 80000, post again, "settlementValid": false | Simone: "Change one number and the signature fails. Nobody can quietly edit a claim, including us." |
| 2:52 | /labour: injuries by time left on the delivery clock, hazard cells ranked by rate | Karina: "The Labour Department sees totals only. No names, no routes. And for the first time, injuries set against delivery deadlines." |
| 2:59 | Landing page model section: recall and precision bars animate in | Karina: "Ninety-three percent of falls caught, at ninety-three percent precision, on people the model never saw." |

About 170 words, 75 seconds. Source corner on the last shot: "UMAFall, leave-subjects-out, 95% CIs, ml/out/results.md".

## Part 5. Split screen (3:05 to 3:30)

Vertical split. Left header TODAY, grey and silent. Right header WITH THE RECORD, colour, system sounds. Same rider, same wet road. One narrator per row.

| Time | Left: today | Right: with the record | Narration |
|---|---|---|---|
| 3:05 | Rider down on a wet road. Text: NO RECORD. | Countdown on the phone, dispatcher card arriving | Maalon: "Same crash. On the right, help knows where and how hard." |
| 3:11 | Rider at home, leg in a cast. Text: NO INCOME. | Phone shows the Paid card. Caption: "Next-day payout [target]" | Alysa: "On the right, a fixed payout the next day." |
| 3:17 | Email from a platform: "You were not on a job." | Signed record: two orders, the split, signature verified | Alysa: "On the left, an argument. On the right, a lookup." |
| 3:23 | Calendar pages flipping. Text: 5 YEARS. HK$1.35M. | Text: DAYS [target] | Karina: "That is the difference a record makes." |

About 40 words, 25 seconds.

## Part 6. Risks and next steps (3:30 to 4:15)

Relay again, one line each, a single card behind each line. This is where we answer the hardest questions before anyone asks.

| # | Speaker | Line | Card behind |
|---|---|---|---|
| 10 | Karina | Our limit: we trained on volunteers falling onto mats, not road crashes. We say so everywhere. | "Simulated falls. Limits listed on the site and in the repo." |
| 11 | Simone | Risk one, false alarms. About ten an hour of phone handling, one every five hours on real motorbike rides. All can be cancelled. | "10.5 per hour handling. 0.2 per hour real riding." Sources: ml/STREAMING.md; TU Wien dataset |
| 12 | Alysa | Risk two, platforms resisting. They are liable either way, and the record settles who pays. | "Liable either way. Apportionment by lookup." |
| 13 | Maalon | Risk three, surveillance. No route history, no risk score, and research data deleted on request. | Consent screen, then the who-sees-what matrix |
| 14 | Hannes | Next on the hardware: helmet drop tests on a rig, and a stronger sensor so hard impacts do not clip. | Drop test protocol page; helmet on the bench |
| 15 | Karina | Next on the model: real rides from riders who opt in, and retraining on their own labels. | Research mode toggle on /rider |
| 16 | Alysa | Then outdoor workers in the heat, and the mainland and Singapore schemes. One record for all of them. | Map card: Hong Kong, Shenzhen, Singapore |

About 115 words, 45 seconds.

## Part 7. End card (4:15 to 4:23)

Whole team, one shot, rooftop, 3 seconds. Then the card for 5 seconds:
- Metrics. Proof for the people who keep this city moving.
- "Statutory compensation for injuries at work." 2026 Policy Address, para 385
- metricsfile.vercel.app (large) and github.com/KarinaKKarinaK/imperial-hackathon
- Team Metrics: Karina Kalicka-Molin, Simone Copetti, Hannes Ganske, Maalon Jochmann, Alysa de Haas. Engineering, natural sciences, medicine and health, business.

## Coverage check against what the judges assess

| Judges look for | Where it is in the video |
|---|---|
| Human story first | Part 1 footage, a rider's voice if recorded, Part 5 |
| Policy anchor, quoted | Part 1 at 0:11, end card |
| Why this is an open challenge problem | Line 3 (Maalon) |
| Scale and burden, with sources | Part 1 cards, Part 3 cards |
| The specific gap and why it persisted | Lines 1 to 3 |
| Evidence base | Source corners on every number; the full evidence table is one click from the repo on the end card |
| Research-grade prototype others can replicate | Part 4 on the live site; open repo on the end card |
| Failure modes and limits | Lines 10 and 11 |
| Validation with uncertainty | Part 4 last shot (held-out people, 95% CIs); line 11 (real riding hours) |
| Regulatory pathway | Part 3 (Labour and Welfare Bureau regime) and line 12; Insurance Authority sandbox and PDPO mapping in the Q&A notes |
| Financial model | Part 3 revenue card, labelled modelled |
| Stakeholders: government, industry, civil society | Parts 3 and 4: platforms, insurers, dispatch, Labour Department; riders and unions in lines 1 and 13 |
| Risk register, top three barriers | Lines 11, 12, 13 |
| Ethics and dual use | Line 13: no route history, no risk score, no platform surveillance |
| Conflicts of interest | Part 3: "We are not the insurer" |
| STEMB integration and teamwork | Line 9; every member speaks at least twice; end card |
| Vision | Lines 14 to 16 |

## Speaking count

Each person speaks only on their own field.

| Speaker | Field | Lines |
|---|---|---|
| Alysa | Business: law, market, money | 2, 8, Part 3, Part 4 payout, Part 5 (twice), 12, 16 |
| Maalon | Medicine and health: injury, triage, ethics | 1, 3, 7, Part 4 dispatch, Part 5, 13 |
| Hannes | Engineering: sensors, helmet clip, drop tests | 5, 9, 14 |
| Karina | ML and software: the model, the data | 6, Part 4 detection, labour data and results, Part 5, 10, 15 |
| Simone | ML and software: the app and the backend | 4, Part 4 app, signed record and verification, 11 |

## Capture list

| Clip | Where | What | Part |
|---|---|---|---|
| C1 | Street | Riders in rain, phone mounts, helmets. Faces only with consent | 1 |
| C2 | Phone, /rider | Consent, language switch, Allow motion, On shift, drop onto a cushion, countdown | 4 |
| C3 | Laptop, /demo?key=... | Reset, start shift, Second app on, Crash, dispatcher card, wait 30 s for Paid | 4 |
| C4 | Laptop, /r/EVT-... | Open the signed copy from the paid card | 4 |
| C5 | Terminal | `curl -s -X POST https://metricsfile.vercel.app/api/verify -H 'content-type: application/json' -d @record.json`, then again with payoutHkd edited | 4 |
| C6 | Laptop, /labour | Slow scroll | 4 |
| C7 | Landing page | Model section bars animating in | 4 |
| C8 | Relay locations | Lines 1 to 15, each shot twice | 2, 6 |
| C9 | Split screen | Rider and road footage for the left side | 5 |

For C5, open /api/events/EVT-... and save the "record" field as record.json.

## Before export

- [ ] Total under 4:30
- [ ] Every number has a source corner; modelled and target items say so on screen
- [ ] "Synthetic crash window" and "Placeholder amounts" captioned in Part 4
- [ ] Para 385 quoted exactly on screen
- [ ] Subtitles on every spoken line
- [ ] Every member speaks at least twice
- [ ] No em dashes or emojis on screen
- [ ] Live URL and repo on the end card
