# Video script

Target 3:35. Ceiling 5:00. Four speakers on camera: Karina, Hannes, Maalon, Alysa. Simone takes any engineering line or runs the demo hands in part 3.

Four parts:
1. Cold open, 0:00 to 0:20. No faces. Big type, hard cuts, a beat under it.
2. Relay, 0:20 to 1:30. One person, one line, one location. Cut on every line. No line over four seconds.
3. Split screen, 1:30 to 3:10. Left: today. Right: with the record. Same rider, same crash, two endings.
4. Close, 3:10 to 3:30.

Rules. Every number on screen has a source line in the corner. Anything marked [target] or [drop test] is not measured yet and gets filled or cut before export. No em dashes anywhere. Speakers do not smile on the problem lines.

## Part 1. Cold open (0:00 to 0:20)

Black. Sound: rain, an order notification, a skid, silence. White type, one line at a time, 2 seconds each. Type gets bigger each cut. No voice from us.

If the rider interviews land (see RIDER_INTERVIEWS.md), open instead on four seconds of a rider's voice over black, verbatim, subtitled: their answer to "what happened after". Then the type. A real voice beats our best line.

| Time | On screen | Source corner |
|---|---|---|
| 0:00 | HONG KONG RUNS ON TWO WHEELS. | |
| 0:02 | 12,900 riders. Zero employers. | C&SD Thematic Household Survey No. 81 |
| 0:04 | When one goes down, the law looks away. | |
| 0:06 | 2 of 22 injured riders compensated. | HKFTU survey, 168 riders, 2021 |
| 0:08 | One typhoon. One rider. Five years in court. | HK High Court, Sep 2025 |
| 0:10 | 41,254 work injury claims a year. Riders are not in that number. | Labour Department OSH Statistics 2024 |
| 0:13 | Now the law is changing. Platforms will pay. | 2026 Policy Address, para 385 |
| 0:16 | Pay for what? | |
| 0:18 | NO RECORD. NO PROOF. NO PRICE. | |

Hard cut to Part 2 on "NO PRICE". Beat drops out.

## Part 2. Relay (0:20 to 1:30)

One shot per line. Speaker into the lens. Lower third on first appearance only. Shoot each twice.

### The problem

| # | Speaker | Line | Location |
|---|---|---|---|
| 1 | Karina | Every order in this city starts with a human body on two wheels. | HKUST entrance, riders passing |
| 2 | Maalon | Every plane has a black box. Every car. The worker has nothing. | Road crossing, traffic behind |
| 3 | Hannes | No employer. No insurance. No proof. Just an algorithm with a countdown. | Next to a parked delivery motorcycle |
| 4 | Alysa | Hong Kong just said: platforms will pay. | Mall food court, delivery pick-up counters |
| 5 | Karina | You cannot pay for a crash nobody can prove. | Desk, phone in hand |
| 6 | Hannes | One in three riders runs two apps at once. Two companies. One body. Who pays? | Two phones, both delivery apps |
| 7 | Alysa | A law without evidence is a promise without a price. | Empty street, standing still |

### The solution

| # | Speaker | Line | Location |
|---|---|---|---|
| 8 | Karina | So we built the black box for the human body. It starts with the phone they already carry. | Lab, phone held to the lens on /rider |
| 9 | Hannes | On a motorbike, add a 3D-printed clip and a forty-dollar board to the helmet. On a bicycle or on foot, the phone is enough. | 3D printer, the clip coming off the bed, ESP32 board in the other hand |
| 10 | Hannes | Impact. Fall. Stillness. Three signals. Few things look like that. | Helmet dropped on the bench, slow motion |
| 11 | Maalon | Thirty seconds to say "I'm fine". Silence, and triage knows where and how hard. | Dispatcher console at metricsfile.vercel.app/dispatch on a laptop |
| 11b | Simone | No new hardware needed to start. The phone in your pocket is already the sensor. | Holding a phone on metricsfile.vercel.app/rider, "On shift" lit. Drops it onto a cushion, cut on impact |
| 12 | Alysa | Same second, the insurance fires. No form. No adjuster. Paid in a day. | Underwriter page, payout line turns green |
| 13 | Karina | It knows which app the rider was on at the moment of impact. | App screen: "On shift: Platform A" |
| 14 | Alysa | "Which company pays" becomes a lookup. Not a lawsuit. | Whiteboard, two logos, one split arrow |
| 15 | Maalon | Heat and fatigue warnings go to the rider. Never the boss. | Outdoors in sun, phone on amber |
| 16 | Hannes | The rider owns the data. Everyone else sees events. Never a route. Never a score. | Consent screen held to camera |
| 17 | Karina | We are not an insurer. We are the evidence. | Corridor walk, steady |
| 18 | Alysa | Hong Kong writes the law. We write the standard. Next door, 84 million workers are waiting for one. | Rooftop, skyline behind |
| 18b | Alysa | [Outside voice, if secured] One line from an insurer, clinician or the union, read as a quote card with their name and role, or their own voice if recorded. | Quote card on dusk gradient |
| 19 | Karina | Same rider. Same crash. Two different worlds. | Turns to lens, cut to black |

20 lines, about 245 words, 75 seconds. If it runs long, cut 5 and 15 first.

## Part 3. Split screen (1:30 to 3:10)

Vertical split. Left header: TODAY. Right header: WITH THE RECORD. Same rider, same wet road, same crash. Left side is grey and silent. Right side is in colour with the system audio. Narration is one voice per row, short.

| Time | Left: today | Right: with the record | Narration |
|---|---|---|---|
| 1:30 | Rider in rain, next order buzzing. | Same rider. Helmet LED on. App: "On shift: Platform A". | Maalon: "Same rider. Same rain. Same order." |
| 1:45 | Crash. Black frame. Text: NO RECORD. | Screen recording of /demo: "Crash" pressed under Feed the detector. Helmet sensor panel spikes past the 6 g line, readout shows p = 0.99 crash, old rule: no. Text: Impact 14g. Tilt 82 degrees. Still 8 seconds. [replace with drop test values] | Hannes: "Impact. Fall. Stillness. The model sees it in under a second. The old rule would have missed it." |
| 2:00 | Rider on the ground, phoning a friend. Text: WHO DO I CALL? | Phone screen (/rider): orange 30, 29, 28 countdown, "I'm OK" button untouched. Cut to /demo map: orange pulse drops on Mong Kok, dispatcher card slides in: "Probable blunt force trauma. Peak 14.2 g, tilt 82 deg, still 8 s." | Maalon: "No answer. Triage already knows where, and how hard." |
| 2:15 | Rider at home, leg in a cast. Text: NO INCOME. | Underwriter panel on /demo: status pill flips to Paid, "Paid out HK$8,000". Phone screen shows the yellow Paid card: "Your record. You own this." Text: Paid in 24 hours. [target] | Alysa: "One event. One payout. No argument." |
| 2:30 | Email to platform. Reply: "You were not on a job." | The rider's signed record page /r/EVT-...: "Signature verified" pill, platform, order, "1 min 34 s left on the delivery clock", verification code. Then the who-sees-what dots on /record. | Alysa: "Which app. Which order. Which second. How many seconds left on the clock. Signed. Done." |
| 2:45 | Calendar pages flipping. Text: 5 YEARS. HK$1.35M. ONE JUDGE. | Text: DAYS. [target] | Maalon: "That is what one typhoon cost one rider." |
| 2:55 | Insurer's screen: blank. Text: NO DATA. NO PRICE. NO COVER. | /demo: Rain toggled on, heat set to red, the premium per window ticks from HK$0.60 to HK$1.26 live. Then the model section of the landing page: the recall bars, rule at 48%, gradient boosting at 94%. Text: PRICED PER DELIVERY. VERIFIED PER CLAIM. | Karina: "Insurers get a loss history. Platforms get a fair premium. Riders get paid." |

Stats strip, bottom of the right side, one at a time from 2:45:
- Drop test detection: [X]% (95% CI [a, b]) [drop test]
- False alarms in controls: [n] of [m] [drop test]
- Settlement: 24 hours [target] vs months today
- Hong Kong pilot: 15,000 riders. Mainland scheme next door: 84 million workers, 14 platforms.

No insurer savings figure on screen unless Alysa's model produces one with assumptions shown. Label it "modelled".

## Demo footage to capture before the edit

All from the live site, so the video and the judges' own browser match. Record at 1440 by 900, 60 fps, cursor visible, no browser chrome (use a kiosk window). Phone shots are screen recordings from iOS or Android.

| Clip | Where | What to do | Used in |
|---|---|---|---|
| D1 | metricsfile.vercel.app/demo | Reset. Start shift. Let the rider move 5 s on the 3D map. | Part 3, 1:30 |
| D2 | /demo | Press Pothole, then Set down, then Bag drop under Feed the detector. Hold on each readout: p = 0.00, 0.00, 0.20, no event. | Part 3, 1:45 (short insert before the crash) |
| D3 | /demo | Press Crash. Capture the sensor spike, the p = 0.99 readout with "old rule: no", the orange pulse on the map, the dispatcher card, the countdown on the phone panel. | Part 3, 1:45 and 2:00 |
| D4 | /demo | Let the 30 s run out. Capture the status pill flipping to Paid and HK$8,000 on the underwriter panel and the phone panel. | Part 3, 2:15 |
| D5 | /record | Slow scroll from the top tile to the Platform at impact row, then the who-sees-what matrix. | Part 3, 2:30 |
| D6 | /demo | Toggle Rain on, Heat to red. Capture the premium per window changing. | Part 3, 2:55 |
| D7 | Landing page, Model section | Scroll into the recall and precision bars so they animate in. Hold 3 s. | Part 3, 2:55 |
| D8 | Phone, /rider | Consent screen, tap continue, Allow motion, On shift. Place on a table. Second phone films over the shoulder. | Relay line 11b |
| D9 | Phone, /rider | Drop the phone onto a cushion from about 40 cm. Capture the countdown appearing. Laptop beside it shows /dispatch receiving the alert. | Relay line 11b, Part 3, 2:00 |
| D10 | Landing page hero | Hover the signal tile so it drops, three signals light up. | Cold open background, optional |
| D11 | Street, a real rider | With consent, a rider opens /rider on their own phone, taps through consent, goes on shift. Hands and screen only unless they agreed to more. | Relay 11b replaces Simone's take if this exists |
| D12 | Street | Rider interview answers, audio clean, subtitled. | Cold open and Part 3 left column |

The site uses placeholder money figures and a synthetic crash window. Say "synthetic" in the caption on D3 if the drop test numbers are not in by the shoot.

## Part 4. Close (3:10 to 3:30)

Full screen. Whole team, one shot, rooftop.

| Speaker | Line |
|---|---|
| Karina | Four disciplines. One problem. |
| Hannes | We built it, then broke it until it told the truth. |
| Maalon | It answers to the rider first. |
| Alysa | And it pays. |
| All | Metrics. Proof for the people who keep this city moving. |

Final card, 4 seconds: team name, para 385 quote, the live URL metricsfile.vercel.app large, STEMB map thumbnail.

Captions: burn in English subtitles for every spoken line (CAPTIONS.srt is the starting point, re-time after the edit). Judges watch on laptops, often muted first.

## Timing
- Part 1: 20 seconds, no speech.
- Part 2: 75 seconds, about 245 words.
- Part 3: 100 seconds, about 110 words of narration. Let the visuals breathe.
- Part 4: 20 seconds, 30 words.
- Total about 385 words, 3:35.

## Shot list by location
- HKUST entrance and road crossing: 1, 2
- Parked delivery motorcycle: 3, split-screen rider shots (a real rider if one agrees, else Hannes with the helmet)
- Food court: 4
- Desk and lab: 5, 8, 11, 12, 13, 16, all dashboard captures
- 3D printer and test bench: 9, 10, sensor trace
- Two phones: 6
- Empty street: 7
- Whiteboard: 14
- Outdoors in sun: 15
- Corridor: 17
- Rooftop: 18, Part 4

## Before export
- [ ] Every [target] and [drop test] filled or cut
- [ ] Source line on every stat
- [ ] Para 385 quoted verbatim on the final card
- [ ] One caption that a flat drop is not a collision
- [ ] Under 5:00
- [ ] No em dashes or emojis on screen
- [ ] Subtitles on every spoken line
- [ ] Live URL on the final card
- [ ] Every member speaks at least twice
- [ ] Synthetic data labelled as synthetic wherever it is on screen
