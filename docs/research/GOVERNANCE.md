# Data governance and consent

One page. Answers Imperial's fourth feedback point and Dr Tin's likely questions. These are design rules enforced in the schema and the app, not promises.

## Who owns what

| Data | Lives where | Who can see it |
|---|---|---|
| Raw accelerometer, gyroscope, GPS trace, speed | The rider's phone and helmet sensor only. Rolling 6 second buffer, overwritten | The rider |
| Shift state (on or off), active platform and job id | Phone, sent with an event only | Rider, and the platform for its own jobs |
| Heat band, fatigue index | Phone, computed locally | The rider. Shown as an alert, never stored upstream |
| Event record (18 fields, see /record) | Server, after 30 seconds of silence from the rider | Rider, the liable platform, the insurer, and on request a court or the Labour Department |
| Aggregate, de-identified event statistics | Server | Insurers for pricing, the Labour Department for the heat warning review |
| Hazard cells: jolts and hard brakes that were not crashes, counted per 50 m grid cell, no rider id | Server | Transport Department and platforms for road and route safety. Public in aggregate |
| Delivery countdown at impact (`deadlineSec`) | In the event record only | Rider, insurer, court. Across many events: the Tripartite Committee, as the first dataset linking time pressure to injury |

The rider owns the raw data and the event record. Platforms and insurers hold a licence to read events for the job they are liable for. No per-rider risk score exists anywhere in the system. Event data never sets an individual rider's premium. GM and OnStar sold driving data that raised drivers' premiums and the US FTC banned the practice for five years; we will not repeat that.

Enforced in code (23 Oct 2026):
- Each phone holds a random key. Only that phone can write for its rider id, cancel its events or read its emergency contact.
- Other riders on shared screens appear with a short id and a position rounded to about 100 m. No contact, no sensor window, no speed.
- Nothing is stored off shift, not even position.
- Hazard cells are published only with at least 3 events, with the time rounded to the hour.
- The Labour Department view (`/labour`) is aggregate only.

## Consent

- Opt in, per shift. The first screen is the consent screen, in plain language, before any sensor is read.
- One tap withdraws consent. Withdrawal clears the buffer and stops the stream. Nothing is read off shift.
- No account, no identity. The rider id is a random string on the device. Linking it to a person is the rider's choice at claim time.
- Consent text is in English, Traditional Chinese and, for the pilot, Nepali and Urdu, since many Hong Kong riders are from South Asian communities.

## Personal Data (Privacy) Ordinance mapping

| DPP | How we meet it |
|---|---|
| 1 Purpose and collection | One purpose: verifying a work-time injury. Collection limited to the 6 second window around an impact |
| 2 Accuracy and retention | Event records kept for the limitation period of a compensation claim, then deleted. Raw data never retained |
| 3 Use | Events used for the claim and for de-identified pricing. No marketing, no performance management, no deactivation signals |
| 4 Security | TLS in transit, encryption at rest, access logged per party |
| 5 Openness | This page, published |
| 6 Access and correction | The rider sees every record about them in the app and can dispute a field |

## What the system cannot be used for

- Not a speed or route tracker. Routes never leave the phone.
- Not a fatigue score for the platform. Alerts go to the rider only.
- Not a deactivation signal. The platform receives an event, not a judgement.
- Not a biometric or emotional profile. The EU Platform Work Directive bans automated processing of a worker's psychological state; we design to that bar even though Hong Kong does not yet require it.

## Integrity

Every record's impact facts are signed by the server with Ed25519 at creation. The public key is published with the schema. A rider's exported copy verifies anywhere, so the record does not depend on us being trusted or even existing. Status and payment are not signed because they change; the facts a dispute turns on do not.

## Dual use, named

The same sensor and the same model could be run by a platform to monitor riders continuously. The controls above are what stop that: the data stays on the device, the only artefact is an event, and the standard is held by a neutral party, not the platform. A platform cannot be the trusted record of its own liability.

## Open questions for the pilot

- Who is the neutral data holder: an insurer consortium, the Insurance Authority sandbox operator, or an independent body.
- Whether the Labour Department needs event access for enforcement, and under what gate.
- Retention period once the compensation ordinance for platform workers sets a limitation period.
