# Insurance mechanism and financial model

Alysa owns the numbers. Every money figure on the site, in the README and in the video comes from `insurance_model.py` in this folder, built on the sourced inputs below. Inputs we could not source are labelled ASSUMPTION with a low, central and high value. No insurer has signed with us yet.

## How Metrics connects to insurance

Metrics is the trigger and the evidence. It does not carry risk and does not sell insurance.

| Party | Role |
|---|---|
| Licensed general insurer | Writes the cover: Class 1 Accident for the fixed tier one payout, Class 13 General liability for the platform's statutory liability (Cap 41, Schedule 1) |
| Platform | Policyholder. Pays the premium. Mandatory under the July 2026 proposal ("Platform operators will be subject to mandatory insurance") |
| Metrics | Supplies the signed event record that triggers tier one, and event data the insurer can price on. Paid a fee by the insurer or platform |
| Rider | Covered. Pays nothing. Keeps every statutory right |

Today: no insurer partner. Next step: a licensed general insurer brings Metrics into the Insurance Authority's Insurtech Sandbox as its technology partner. The sandbox is open to authorised insurers, and the IA "will work with technology companies cooperating with them" (secondary source, startmeup.hk; the IA site blocked automated fetch).

## Parametric conditions

Tier one pays when all four are true:
1. The model's crash probability is at or above 0.5 for a window from the rider's phone or helmet (with the helmet paired, both sensors must agree within 1 second).
2. The rider was on shift with at least one open order.
3. Nobody cancelled within 30 seconds.
4. The signed event record verifies at `/api/verify`.

Tier one is a fixed sum paid at the cancel deadline. Tier two pays the statutory amounts once a hospital admission is recorded and the insurer confirms it.

## Regulatory pathway

1. A licensed insurer writes the policy. Carrying on insurance business needs authorisation (Cap 41 s6(1)); Metrics never does, and never "holds himself out" as an insurer (s2(3)(b)).
2. Fixed-sum cover is a lawful product: Class 1 Accident covers "fixed pecuniary benefits or benefits in the nature of indemnity (or a combination of both)", including "contracts relating to industrial injury".
3. Metrics never invites or induces a rider to make a claim, which is a regulated activity when done for reward (s64G, Schedule 1A). It supplies the verified record as clerical support for the insurer (s123(2)). The insurer, not Metrics, tells the rider about a payout. Legal opinion before the pilot.
4. The payout stays tied to a real injury to the insured rider, which keeps the insurable interest required by s64B.
5. Tier one adds to statutory compensation and is never deducted from it. A contract that "removes or reduces the employer's liability to pay employees' compensation" is void (ECO s31); whether the platform regime copies s31 is not yet published, and we design as if it does.
6. Parametric contracts are recognised in Hong Kong: "no specific legislation governing parametric insurance", such contracts are "generally recognized as valid insurance contracts" (DLA Piper, 2024). Typhoon signal and flight delay parametric covers are already sold here (reported, not opened).

## Sourced inputs

| Input | Value | Source |
|---|---|---|
| Hong Kong delivery platform workers | 12,900 people, 18,100 platform jobs | C&SD Thematic Household Survey No. 81, in LegCo CB(1)410/2025(04), 24 Mar 2025 |
| Average monthly income from platform work | HK$10,900; HK$21,600 for riders working over 40 hours a week | Labour Department rider survey of 1,984 respondents, same paper, Annex 2 |
| Average hours | 23.7 a week | same |
| Sick leave payment | four fifths of the earnings difference | Labour Department, Concise Guide to the ECO, Apr 2026 |
| Minimum compensation for death | HK$514,510 | ECO appendix, Mar 2025; applies to platform workers per LWB CB(1)839/2026(02), 17 Jul 2026 |
| Minimum earnings floor (HK$5,710) | waived for platform workers | LWB CB(1)839/2026(02) |
| Injury rate, all industries | 9.8 per 1,000 employees, 2024 | Labour Department OSH Bulletin, Aug 2025 |
| Fatal share of injuries, transport, storage, postal and courier | 38 of 3,036 (1.25%) | Labour Department OSH Statistics 2024 |
| Mainland contribution rate, instant delivery | 0.07 yuan per order | 人社部发〔2025〕24号, as applied in Fujian (闽人社发〔2025〕6号) |
| Mainland coverage | 37.27 million insured, 108.7 billion orders, to end Sep 2026 | SCIO briefing 10 Oct 2026, reported by Xinhua Finance (primary transcript not opened) |

Not found, so not used: a published median rider income (C&SD gives bands only), the employees' compensation line's own premium and loss ratio (IA site blocked), and any public price for verification or telematics fees.

## Assumptions

| Assumption | Low | Central | High | Why |
|---|---|---|---|---|
| Tier one payout | half of HK$5,000 | half of HK$10,900 | half of HK$21,600 | Half a month of platform income bridges the gap before the statutory process |
| Injuries per 1,000 riders a year | 10 | 20 | 40 | 9.8 is the all-industry rate; road exposure is at least double |
| Sick leave days per injury | 14 | 30 | 60 | |
| Medical cost per injury | HK$2,000 | HK$5,000 | HK$10,000 | |
| Death payout | HK$514,510 | HK$514,510 | 84 months of HK$21,600 | Statutory minimum, or the ECO formula for a full-time rider |
| Share of injuries with permanent partial incapacity, and its payout | 2%, HK$50k | 5%, HK$100k | 10%, HK$200k | |
| Insurer target loss ratio | 70% | 60% | 50% | Sets the loading on the pure premium |
| Metrics fee as share of premium | 3% | 5% | 10% | No public comparable, so a share of premium |
| Orders a year, one mainland platform | 10bn | 20bn | 30bn | No verified order count |
| Metrics fee as share of mainland premium pool | 0.5% | 1% | 3% | |

## Results (`python3 docs/research/insurance_model.py`)

| Output | Low | Central | High |
|---|---|---|---|
| Tier one payout | HK$2,500 | **HK$5,450** | HK$10,800 |
| Cost per injury, including tier one | HK$13,807 | HK$30,610 | HK$98,070 |
| Pure premium per rider a year | HK$138 | HK$612 | HK$3,923 |
| Loaded premium per rider a year | HK$197 | HK$1,020 | HK$7,846 |
| Loaded premium per rider a month | HK$16 | **HK$85** | HK$654 |
| Loaded premium per 20 minute delivery window | HK$0.05 | **HK$0.28** | HK$2.12 |
| Metrics fee per rider a year | HK$6 | HK$51 | HK$785 |
| Hong Kong pilot revenue, 12,900 riders | HK$0.08m | **HK$0.66m** | HK$10.1m |
| Mainland premium pool, one platform | 0.7bn yuan | 1.4bn yuan | 2.1bn yuan |
| Metrics revenue, one mainland platform | 3.5m yuan | **14m yuan** | 63m yuan |

Cross-check: the mainland rate of 0.07 yuan per order at 2 to 3 orders an hour (51.6% of Hong Kong jobs, same LegCo paper) is about HK$0.19 per riding hour. Our central loaded premium is HK$0.83 per riding hour, because it also funds tier one and Hong Kong's higher statutory amounts.

What this says: Hong Kong pays for a pilot and a sandbox, not a business. The business is the mainland and Singapore schemes, where premiums are already paid on every order.

The site uses the central values: HK$5,450 tier one and HK$0.28 base premium per window. The rain, heat and fatigue multipliers on the premium are assumptions, not sourced.

## Basis risk

A parametric trigger can pay when it should not, or miss when it should pay. Measured on held-out people: 14 false alarms in 417 non-fall recordings and 14 missed falls in 208 at threshold 0.5 (`ml/out/results.md`); in a live loop, 10.5 false alarms an hour of everyday phone handling and 0.2 an hour of real motorbike riding (`ml/STREAMING.md`, `ml/PUBLIC_RIDES.md`). Each uncancelled false alarm pays one tier one that should not be paid; each miss leaves the rider on the statutory route only. The 30 second cancel and the hospital record for tier two are the controls.

## Risk register

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| Platforms refuse to adopt a record that proves injuries | Medium | High | They are liable and must insure either way under the July 2026 proposal. Verified events settle apportionment. Pilot with the platform that gains most |
| Regulator treats our record as claims handling or inducement | Medium | Medium | Partner insurer holds the licence; Metrics does clerical work only (s123(2)) and never invites claims (s64G). Legal opinion before the pilot |
| No insurer partner | High today | High | Sandbox route with an insurer as lead; Metrics as technology partner |
| Mainland platforms will not buy from a Hong Kong team | High | Medium | The standard travels through insurers and reinsurers on both sides |
| False alarms inflate payouts | Medium | High | 30 second cancel, two-sensor agreement, measured rates published, hospital record for tier two |
| Riders decline consent | Medium | High | Opt-in per shift, rider-owned record, no route history, no risk score, faster payout as the incentive. Measure opt-in in the pilot |
