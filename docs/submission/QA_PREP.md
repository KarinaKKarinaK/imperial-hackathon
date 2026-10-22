# Question bank for the Grand Final

Rule from the briefing: every member must be able to answer. Each of you owns a block but rehearse all of them. Answers are one breath long. If you do not know, say so and say how you would find out.

## Evidence and health (Maalon, Hannes)

**Where does the 2 of 22 come from?** A Hong Kong Federation of Trade Unions survey of 168 food delivery workers, July to August 2021, reported in The Standard on 24 Aug 2021. It is self-reported and small. We dropped an earlier 13% figure because we could not trace its source. We use it as the hook, not as a prevalence estimate. The official number that matters is 41,254 compensation cases a year with riders excluded by definition.

**Falls on mats are not motorcycle crashes. Why should we believe the model?** You should not believe it proves road performance, and we say so on the site. UMAFall gives us 625 labelled recordings to show the method works and to beat the rule by a wide margin. The helmet drop tests will add measured impacts once the rig runs. Road trials are the next step and we have scoped them.

**How did you set the triage bands?** Peak linear acceleration thresholds from the concussion biomechanics literature [Rowson and Duma 2013, Zhang 2004, confirm]. The output is labelled probable. It tells a dispatcher where and roughly how hard, never a diagnosis.

**What about rotational injury?** The gyroscope is on the board and logged. We have not used it in the model yet because the public dataset has no head-mounted gyro. It is the first thing the drop test data unlocks.

**Is the fatigue index validated?** No. Today it is shift hours only; the speed variance input is not wired yet. It is an alert to the rider only, never stored, never shared. We would not claim more until it is studied.

## Model and engineering (Karina, Simone)

**Why gradient boosting and not deep learning?** We trained both. The 1D CNN had lower recall (84% against 94%) and a worse Brier score on held-out people. Boosting on ten physical features is better calibrated, is a few kilobytes of JSON, and runs on the server and on the phone for the live readout.

**What is the false alarm rate in practice?** On held-out subjects, 14 false alarms in 417 non-fall recordings at threshold 0.5 (precision 93%). Most are a phone being pulled from a pocket to make a call. Every false alarm meets the 30 second cancel. The threshold sweep is published. In a live loop over everyday phone handling the phone-only detector raised about 19 false alarms an hour; retraining on the windows it wrongly flagged cut that to 10.5 with 200 of 208 falls caught (ml/STREAMING.md). The rest are phones taken out for a call; the helmet and phone agreement rule and real ride data are the next fix.

**Can the model be gamed by a rider?** A rider could drop the helmet on purpose. The event is a trigger for a fixed first-tier payout, hospital records unlock the second tier, and repeated events from one record id are visible to the insurer. Fraud risk is priced like any parametric product.

**Why does the phone and the server run the same model?** So the number a rider sees is the number the insurer sees. The trees are exported to JSON and checked against the Python output to three decimals in the test suite.

**What happens with no signal?** Today the window is only checked when the phone has data. The phone already runs the same model locally for the live readout; queueing the event offline and sending it when the signal returns is the next step.

## Policy and governance (Maalon, Hannes)

**Does this help or complicate the government's legislation?** It operationalises it. The July 2026 proposal splits liability between platforms when a rider is on several apps. Nobody can apply that clause without a record of which job was active at impact. That field is in our schema.

**Who owns the data?** The rider. Raw motion is checked in 6 second windows and discarded; no route history is kept. The event record is the only artefact and it is the rider's. Platforms and insurers hold a licence to read the events they are liable for.

**Could a platform use this to surveil riders?** The design makes that hard by construction: no route, no speed history, no per-rider score exists anywhere upstream. We name the dual-use risk on the site because pretending it does not exist would be dishonest.

**PDPO?** Mapped principle by principle in our governance page: single purpose, six second collection window, retention tied to the claims limitation period, rider access to every record.

**What would Dr Tin's unit need to see before recommending a pilot?** Rider consent rates from a real cohort, the helmet drop test numbers, a legal view on whether event verification counts as claims handling, and a neutral data holder. We have the list and the order.

## Business (Alysa)

**Who pays and how much?** Platforms pay a monthly fee per insured rider, insurers pay per verified event, riders pay nothing. Hong Kong at 15,000 riders is low single-digit HK$ millions a year. It funds a pilot, not a company. The mainland scheme next door covers 84 million workers with flat premiums and manual claims. That is the market.

**Why would a platform pay to prove its riders got hurt?** Because under the new law it is liable either way. A verified record lowers the premium, settles the split with the other platform in a lookup, and ends five-year court cases.

**Why would a mainland platform buy from a Hong Kong student team?** It probably would not buy from us. It would adopt a standard carried by the insurers and reinsurers that operate on both sides of the border. That is why we built a record, not an app.

**Are you an insurer?** No. We are the sensor, the trigger and the data standard. A licensed insurer carries the risk. Our regulatory route is the Insurance Authority sandbox with one insurer and one platform.

**What kills this?** Three things, in our risk register: a regulator classing verification as claims handling, riders declining consent, and a platform building it in-house. The answers are a sandbox legal opinion, a consent study in the pilot, and neutrality: a platform cannot be the trusted record of its own liability.

**Most riders are not on motorbikes. Does a helmet clip help a cyclist?** More than half of Hong Kong's riders are cyclists or walkers, so the phone is the product and the clip is the upgrade for helmets. The record has a travel mode field and the detector is trained on phone data. Nobody is excluded by what they ride.

**A platform says the rider was not on a job. Then what?** The record is signed at creation with the platform, order id and the seconds left on the delivery countdown. The rider holds a copy that verifies against a published key. The next step is capturing the platform's own order notification on the phone, which Android allows and iPhone does not.

**What does the data do for prevention, not just payment?** Jolts and hard brakes that never become events are aggregated to 50 m cells with no rider id. That is a hazard map for the Transport Department and a route-risk input for platforms. The delivery-countdown field, across many events, is the first dataset linking time windows to injuries.

## Team and process (anyone)

**Who did what?** Point at the STEMB map on the poster. Each pillar has a deliverable you can open: the model results, the drop test protocol, the triage bands, the two-column financial model.

**What did you change after feedback?** Imperial asked about consent, validation, the insurance trigger and STEMB coverage. The consent screen, the leave-subjects-out evaluation, the apportionment field and the integration map are the answers.

**What would you do with three more months?** Road trials with twenty riders, the gyroscope in the model, a sourced premium with one insurer, and the Cantonese and Nepali consent flows tested with the people who will use them.
