# Insurance mechanism and financial model

Alysa owns the numbers. This page fixes the structure and lists every assumption so the spreadsheet and the poster agree. All money figures are placeholders until sourced.

## Mechanism

1. Trigger. A verified event: model probability at or above threshold, rider on shift, no cancel inside 30 seconds. The event itself is the trigger. No claim form, no adjuster.
2. Tier one. Fixed payout within 24 hours. Placeholder HK$8,000, roughly two weeks of median rider income. Covers the gap before any statutory process.
3. Tier two. Hospital admission confirmed by a discharge record unlocks the statutory amounts under the proposed regime (sick leave payments, medical expenses, permanent incapacity, with the ECO ceilings of HK$514,510 and HK$584,220 for death and total incapacity and HK$38,670 per month earnings cap, per the July 2026 proposal).
4. Apportionment. When the rider is on several apps, the record's platform field assigns tier one to the active platform and splits tier two per the regime's rule.

## Who pays whom

- Platform pays the premium per insured rider per month to a licensed insurer. We are not the insurer.
- Insurer pays the rider on a verified event.
- Platform and insurer pay Metrics: a monthly fee per insured rider for the record and the model, and a fee per verified event.
- The rider pays nothing.

## Regulatory pathway

- Insurance Authority Insurtech Sandbox for the pilot, with one licensed general insurer as the risk carrier.
- Metrics acts as a technology and data provider, not an insurance intermediary. Confirm with the Insurance Authority whether event verification counts as claims handling under the Insurance Ordinance (Cap. 41) and whether a licence is needed.
- PDPO compliance per research/GOVERNANCE.md.
- Labour Department engagement through the Tripartite Committee for the Digital Platform Industry.

## Two-column model

| Line | Hong Kong pilot | One large platform |
|---|---|---|
| Insured riders | 15,000 | 10,000,000 |
| Premium per rider per month (platform to insurer) | HK$[ ] | HK$[ ] |
| Metrics fee per rider per month | HK$[ ] | HK$[ ] |
| Verified events per 1,000 riders per year | [ ] from injury rate evidence | same |
| Metrics fee per verified event | HK$[ ] | HK$[ ] |
| Annual Metrics revenue | low single-digit HK$ millions | HK$[ ] |
| Build cost to pilot | HK$[ ] (hardware, app, sandbox legal) | n/a |
| Cost per helmet clip at 1,000 units | HK$[ ] | HK$[ ] at 100,000 units |
| Break-even month | [ ] | [ ] |

Sources needed: rider injury rate per 1,000 per year (evidence table rows 11, 13, 15), median rider income (C&SD survey), comparable parametric products (Singapore platform worker cover since Jan 2025, mainland scheme per-order premiums reported by Meituan).

## Sensitivity

Run tier one payout, event rate, and false alarm rate through plus or minus 50% and show the premium range. The false alarm rate comes straight from the results table (precision), which is why the model matters to the business pillar.

## Risk register

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| Platforms refuse to adopt a record that proves injuries | Medium | High | They are liable either way under the new law. Verified events lower premiums and settle apportionment. Pilot with the platform that gains most from lower premiums |
| Regulator treats verification as claims handling and requires a licence | Medium | Medium | Sandbox first. Partner insurer holds the licence. Legal opinion before pilot |
| Mainland platforms will not buy from a Hong Kong team | High | Medium | The standard travels through insurers and reinsurers that operate on both sides. Position as a standard, not a vendor |
| False alarms erode trust or inflate payouts | Medium | High | 30 second cancel, model precision reported with intervals, hospital record for tier two |
| Riders decline consent | Medium | High | No data off shift, rider-owned record, faster payout as the incentive. Measure opt-in in the pilot |
