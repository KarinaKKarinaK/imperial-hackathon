# Market size and reframing options

Research date: 17 Oct 2026. Question: is the market big enough, and how do we frame the idea so it reads as influential rather than niche.

## The honest numbers

### Hong Kong alone is small
| Figure | Value | Source |
|---|---|---|
| Platform delivery workers in HK | ~12,900 (government survey, Dec 2023 to Mar 2024). Deliveroo's 2025 exit alone was reported to affect ~12,000 riders, so the real figure is probably higher but still tens of thousands at most | China Daily HK, SCMP |
| Riders working for more than one platform | about one third | same survey |
| Riders for whom delivery is main income | ~65% | same survey |
| Keeta share of orders Q1 2024 | 43%, Foodpanda 37%, Deliveroo 20% (Deliveroo left HK in 2025) | China Daily HK |
| Foodpanda typhoon injury case | HK$1.35m awarded Sep 2025 for a 2020 injury, five years to resolve | Human Resources Online |

Verdict: a rider-only Hong Kong product has a customer base of two platforms and maybe 15,000 to 20,000 riders. That is a pilot, not a market. The judges will see this.

### What is big
| Figure | Value | Source |
|---|---|---|
| HK employees' compensation cases per year | 41,254 (2024), 244 fatal | Labour Department OSH Statistics 2024 |
| HK general liability insurance line (mostly employees' compensation) | HK$12.1 billion gross premiums, 2024 provisional | Insurance Authority, 25 Apr 2025 |
| HK registered construction workers | 667,603 (Dec 2024), highest fatality rate of any sector | CIC 2024 annual report |
| HK Heat Stress at Work Warning | introduced 2023, criticised for never issuing red or black, not legally binding, under review with the Observatory as of Aug 2026 | Eco-Business, The Standard, TVB |
| Mainland China "new forms of employment" workers | 84 million | China Daily |
| Mainland occupational injury scheme for platform workers | pilot from Jul 2022, 12.3m covered by Jul 2025, extended nationwide Jul 2026, 14 platforms | Asia Insurance Review, Insurance Business |
| Meituan premiums paid into that scheme | over 3 billion yuan, Jul 2022 to Jun 2026, 10m+ riders | China Daily Jul 2026 |
| Motorcyclists in Asia | over 400 million (50 million in the rest of the world) | Insurance Business Asia |
| Platform workers worldwide | 150 to 400 million (ILO range) | ILO, People Matters |
| Parametric insurance market | USD 3.5bn to 21bn in 2025 depending on scope definition, 12 to 14% CAGR | Mordor, GMI, Research and Markets |

Two things stand out. First, the mainland just made occupational injury insurance for platform workers mandatory nationwide, so there are now 14 platforms and their insurers paying billions of yuan in premiums for a risk nobody can verify at the event level. Second, Hong Kong's own compensation system handles 41,000 cases and HK$12 billion in premiums a year, and riders are the one group about to be added to it with no data trail.

## Three ways to reframe

### Reframe 1: Hong Kong is the sandbox, the GBA and the mainland scheme are the market
Pitch line: "China just put 84 million platform workers into a national injury insurance scheme. Nobody can verify a single claim at the point of impact. Hong Kong's new law is the place to build the verification layer first."

- Keeps para 385 as the anchor. Hong Kong legislates, we prototype under the Insurance Authority sandbox, then the standard travels across the border.
- Customers become the 14 platforms in the mainland scheme and their insurers, not two HK apps. Meituan alone pays about 1 billion yuan a year in premiums.
- The GBA framing is natural for this hackathon (Shenzhen and Guangzhou have tens of thousands of riders each and Guangzhou passed rider speed rules in Dec 2024).
- Risk: do not drift into Challenge 5 (GBA connectivity). Keep it as occupational health with a cross-border market, not infrastructure.
- Business pillar task: one slide on how a HK-licensed insurer plus a mainland partner would use the event standard, and the premium pool it touches.

### Reframe 2: From riders to every outdoor worker exposed to heat and impact
Pitch line: "Riders are the first group. The same helmet and phone layer covers construction, cleaning, porterage and security: 41,000 compensation claims a year and HK$12 billion in premiums."

- The heat module is the bridge. Hong Kong's heat warning system is under public criticism and under review right now. A per-worker heat exposure record is exactly what is missing from a warning that is city-wide and not binding.
- Construction has 667,603 registered workers and the worst fatality rate. Helmets are already mandatory there, so a sensor clip has an obvious home.
- The insurance mechanism stays the same: verified event, parametric payout, premium adjusted by exposure.
- Risk: construction robots were an idea we already rejected for policy-anchor reasons, so keep para 385 and riders as the entry point and present construction as the expansion path, not the core.
- Keeps us inside occupational health, which Challenges 1 to 5 do not cover.

### Reframe 3: From an insurance product to the "flight recorder" for work injury
Pitch line: "Every car has a black box. No worker does. We built the work-injury event record that the new law, the insurers, the courts and the Tripartite Committee all need."

- Market is the compensation system itself, not a premium. The Foodpanda case took five years and a High Court judge to decide what happened in one typhoon. A verified event record settles that in seconds.
- Customers: the Labour Department (enforcement and the heat warning review), insurers (claims verification and pricing), platforms (liability defence and lower premiums), riders (proof), courts and unions (evidence).
- Positions the team as a data standard and trigger provider, open to any insurer, which is exactly how the Imperial feedback described the parametric element and avoids us claiming to be an insurer.
- This is the "influential idea" angle. It plugs straight into the legislation para 385 promises and gives the Tripartite Committee something concrete to adopt.
- Risk: a standard is harder to demo than a product. The drop test plus live dashboard still carries the demo; the standard is the schema those dashboards read.

## Recommendation
Use 3 as the identity and 1 as the market. Keep 2 as one slide on expansion.

In one sentence: "A verified work-injury event record, built in Hong Kong for the riders para 385 is about to cover, priced by parametric insurance, and designed as a standard that the 84 million workers in the mainland scheme and every outdoor worker in Hong Kong can use."

What changes in the deliverables:
- Problem statement stays as submitted. Imperial approved it.
- Poster and video add one "scale" panel with the table above.
- Insurance model shows two numbers: HK pilot economics and the mainland premium pool as the addressable market.
- Governance page gains weight: a standard that travels needs the consent and data-ownership rules baked into the schema, not added later.
- Rename the event schema in the repo and dashboards to make the "record" idea visible in the demo.

## Gaps still to fill
- No official count of HK riders after Deliveroo's exit. Ask the Labour Department survey or the union for a 2025 figure.
- No GBA-wide rider headcount or injury statistics. Guangdong traffic police releases are the next place to look.
- Find the original 2024 union survey behind the 13% figure.
- Exact employees' compensation premium figure (the HK$12.1bn is the whole general liability line). Check the Insurance Authority annual annex of 5 Dec 2025.

## Sources
- https://chinadailyhk.com/article/607159
- https://www.scmp.com/opinion/comment/article/3360397/hong-kong-finally-moves-extend-labour-rights-gig-economy
- https://www.scmp.com/opinion/letters/article/3364836/hong-kong-should-study-mainland-gig-worker-insurance-model
- https://globalvoices.org/2025/06/14/hong-kong-workers-strike-against-the-algorithmic-exploitation-of-keeta-a-food-delivery-platform/
- https://www.humanresourcesonline.net/hong-kong-high-court-finds-foodpanda-liable-orders-hk-1-3mn-compensation-to-rider-injured-during-typhoon
- https://www.labour.gov.hk/common/osh/pdf/OSH_Statistics_2024_en.pdf
- https://www.labour.gov.hk/eng/public/iprd/2024/figure_en/figure6_4.htm
- https://www.ia.org.hk/en/infocenter/press_releases/20250425.html
- https://www.cic.hk/files/page/10499/3.%20Figures%20at%20a%20Glance%20in%202024.pdf
- https://www.eco-business.com/news/rising-heat-spurs-calls-to-protect-hong-kongs-outdoor-workers/
- https://www.thestandard.com.hk/news/article/339595/
- https://asiainsurancereview.com/News/ViewNewsLetterArticle/id/92197/Type/eDaily
- https://www.insurancebusinessmag.com/asia/news/breaking-news/china-extends-gig-worker-injury-scheme-nationwide-581407.aspx
- https://global.chinadaily.com.cn/a/202607/03/WS6a476a25a310986e2b463676.html
- https://www.insurancebusinessmag.com/asia/news/breaking-news/smart-helmets-to-make-insurance-unique-for-each-motorcyclist-74931.aspx
- https://sea.peoplemattersglobal.com/news/economy-policy/ilo-adopts-first-global-labour-standard-for-platform-economy-workers-51343
- https://www.gminsights.com/industry-analysis/parametric-insurance-market
- https://www.mordorintelligence.ar/industry-reports/parametric-insurance-market
- https://subsites.chinadaily.com.cn/npc/2024-12/16/c_1053360.htm

## Follow-up: Macau and delivery drivers in general (17 Oct 2026)

### Macau
- No official rider headcount found. Platforms are mFood and Aomi. Macau's population is about 690,000, so the rider base is at most low thousands.
- Fatal rider crashes are on record (an mFood rider in 2022, a delivery driver killed by a tour bus at Rotunda do Istmo, Cotai, 28 April, year unstated). Riders went on strike against Aomi in August 2026 over base pay.
- The Macau government has said it has no plans for dedicated labour rules for takeaway couriers. A lawmaker (Leong Hong Sai) filed a written inquiry asking for rules and protections. A Transport Advisory Committee member called on platforms to run safe-driving courses.
- University of Saint Joseph ran a "Food in a Flash" survey on Macau rider working conditions. Worth citing in the evidence base.
- Verdict: Macau is a mirror case, not a market. Use it in one line: "Hong Kong is legislating, Macau has said it will not, and riders are dying in both." It strengthens the policy gap argument and gives the GBA framing a second jurisdiction. Do not switch the anchor to the Macau Policy Address; it has no delivery worker commitment we could quote.

### Delivery drivers in general (goods, parcels, vans)
- The Hong Kong survey figure of ~12,900 already covers food and goods delivery platforms, so adding Lalamove and GOGOX type platform drivers does not change the number much. The wider freight transport and storage sector in Hong Kong employs about 152,800 people (2022), and the government has no injury data split for drivers.
- SF Express Hong Kong lists about 10,000 staff, Lalamove's HK entity about 7,700. Both are database estimates covering all staff, not driver counts.
- Internationally, parcel delivery is among the top ten most injury-prone industries in US data for two decades, and courier injury rates rose from 2015 to 2022 while overall US industry rates fell. US trade press puts couriers and messengers at about 51 injuries per 10,000 workers (unverified against the BLS table). Amazon alone had 75,000 US last-mile drivers through delivery partners in 2019.
- No reliable global count of last-mile drivers exists. The ILO platform worker range (150 to 400 million) is the only defensible global figure and it mixes delivery, ride-hailing and online work.
- Verdict: "delivery drivers in general" widens the story but not the Hong Kong number. The right move is to widen by risk type (two-wheeler, outdoor, time-pressured) rather than by job title. Van drivers have a vehicle with its own black box and are usually employees already covered by compensation law. The uncovered group is the self-employed two-wheeler worker, and that is the group the mainland scheme and Singapore's rule target.

### Comparator worth adding to the legal track
- Singapore has required platform operators to buy work injury compensation insurance for platform workers since 1 January 2025. Hong Kong's proposed regime (LCQ22, 21 Jan 2026; RTHK, 10 Jul 2026; Simmons and Simmons note) follows the same direction. Our event record is the verification layer both regimes lack.

### Additional sources
- https://macaubusiness.com/food-delivery-riders-plan-strike-over-low-pay/
- https://www.macaubusiness.com/food-delivery-platforms-should-improve-safety-conditions-of-employed-drivers-transport-advisory-committee-member/
- https://macaonews.org/features/unsung-heroes-meet-the-riders-who-kept-macao-fed-during-the-pandemic/
- https://usj.edu.mo/?p=49896
- https://macaudailytimes.com.mo/tag/labor
- https://www.info.gov.hk/gia/general/202601/21/P2026012100230p.htm
- https://news.rthk.hk/rthk/en/component/k2/1861808-20260710.htm
- https://www.simmons-simmons.com/en/publications/cmrsvfcev004wtr54meqgtw0t/hk-proposes-work-injury-compensation-regime-for-platform-workers
- https://www.marsh.com/sg/services/affinity-partners-sponsored-programs/products/protecting-platform-workers.html
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11850030/
- https://stacks.cdc.gov/view/cdc/261663/cdc_261663_DS1.pdf
- https://www.bls.gov/iag/Tgs/iag492.htm
- https://www.supplychain247.com/article/new-data-reveals-the-most-injury-prone-jobs-in-the-supply-chain/optimization
- https://chinadailyhk.com/article/607159

## Follow-up: all digital platform workers, HK vs HK+Macau vs mainland, and domestic helpers (17 Oct 2026)

### Domestic helpers: not our market, and here is why
- Hong Kong has roughly 370,000 foreign domestic helpers (verify the current figure with the Immigration Department). They are employees on the Standard Employment Contract. Employers must hold employees' compensation insurance for them, and for part-time local helpers too, under section 40 of the Employees' Compensation Ordinance. Failing to insure is a criminal offence (fines up to HK$100,000, up to two years in prison).
- So helpers already sit inside the compensation system we say riders are locked out of. Adding them weakens the policy gap argument instead of strengthening it.
- Platform-engaged part-time cleaners (app-based home services) are a real grey zone, but there is no headcount and no policy anchor. The HK proposal covers food and goods delivery only.
- Macau: 28,611 non-resident domestic workers at end 2025, inside a total of 183,679 non-resident workers. Same story: employed, insured.
- Verdict: leave helpers out. If a judge asks, the answer is "they have an employer and a policy, riders have neither. The uninsured gap is the self-employed platform worker."

### Platform workers: the three-tier comparison

| Tier | Platform workers | Injury cover today | What is changing | Source quality |
|---|---|---|---|---|
| Hong Kong | ~12,900 food and goods delivery platform workers holding ~18,100 platform jobs (C&SD Thematic Household Survey No. 81, Dec 2023 to Mar 2024). No official count for ride-hailing or home-service platforms. | None statutory. Self-employed, outside the Employees' Compensation Ordinance. | Government proposal (Jul 2026): standalone no-fault statutory regime for delivery platform workers, platforms liable, ECO minimums kept, HK$5,710 floor waived, liability apportioned between platforms when a worker is on several apps at once. Target: introduce by end 2026. | Official |
| HK + Macau | HK figure plus low thousands in Macau (mFood, Aomi). No official Macau count. | Macau: none. Government says no dedicated rules planned. | Macau lawmaker inquiry pending, nothing scheduled. | Thin |
| Mainland China | 84 million in "new forms of employment" (ACFTU survey, 2022 data). 200 million plus "flexible workers" (MOHRSS). Meituan alone reports 10 to 13 million riders. | Occupational injury protection scheme: pilot Jul 2022, 12.3 million covered by Jul 2025, nationwide across 31 provincial regions and 14 platforms from Jul 2026. Meituan has paid over 3 billion yuan in contributions. | Scheme is live and scaling. Premiums are flat per order or per rider, not risk-based, and claims verification is manual. | Official and company reports |

Ratios: Hong Kong is about 0.015% of the mainland platform workforce. Hong Kong plus Macau changes nothing. The mainland scheme is roughly 1,000 times the Hong Kong pool and it is already paying premiums.

### Can the idea still work, and is it big enough on the business side

Yes, with one honest adjustment: we are not selling insurance to 13,000 Hong Kong riders. We are selling verification to the people who are about to carry the liability.

Why the business case got stronger this week, not weaker:
1. The Hong Kong proposal makes platforms liable on a no-fault basis. Platforms will insure that liability. Insurers will need to price a risk with no history. That is the first customer, and the government has said it is weighing operators' affordability, which is exactly where risk-based pricing helps.
2. The proposal apportions liability between platforms when a rider is on several apps at the moment of injury. One third of Hong Kong riders work for more than one platform. Nobody can settle that split today without a record of which app job was active at impact. Our event record answers it. This is a concrete, legislated need, not a hypothetical.
3. The mainland scheme now covers tens of millions of riders with flat premiums and manual claims. Risk-based pricing and automated verification are the obvious next step and the market is already paying.
4. Singapore has required platform operators to buy work injury compensation insurance since 1 Jan 2025. Three jurisdictions in the region moved in 18 months. The verification layer does not exist in any of them.

What the revenue model looks like:
- Who pays: platforms (liability holders) and insurers (pricing and claims). Riders never pay.
- Unit: a monthly fee per active insured rider, plus a per-event verification fee on claims.
- Hong Kong pilot (12,900 riders) is worth about HK$0.66m a year in the central case of our sourced model (HK$0.08m to HK$10.1m, docs/research/INSURANCE_MODEL.md); an earlier estimate of low single-digit millions only holds in the high case. That funds a pilot and a sandbox licence, nothing more. Say so on the poster.
- Mainland or Southeast Asia at one platform with 10 million riders is the real number. One slide, with the assumptions shown.
- Hardware: the helmet clip is a cost line, not a revenue line. Phone-only tier first, helmet tier for platforms that want crash-grade data.

What the judges will push on, and the answers:
- "Hong Kong is tiny." Agreed. Hong Kong is the first common-law jurisdiction legislating a no-fault platform worker regime with multi-platform apportionment. It is the right place to set the standard, not the place to make money.
- "Why would platforms adopt something that proves their riders got hurt?" Because they are liable either way under the new law, and verified data lowers premiums, settles apportionment, and defends against fraudulent or misattributed claims. The Foodpanda typhoon case cost HK$1.35 million and five years.
- "Why would riders wear it?" Faster payout with no claims fight, and a record that works for them. Consent design and data ownership rules are the answer, and they are already in the plan.
- "Why would a mainland platform buy from a Hong Kong team?" They may not. The standard can travel through insurers and reinsurers who operate across the border. Name that as a risk in the register.

Bottom line for the business pillar: build the financial model with two columns, Hong Kong pilot and one large-platform deployment. Lead the pitch with the apportionment problem because it is specific, legislated, and unsolved. The social return column (faster payouts, fewer contested claims, fatal cases with an objective record) is what the hackathon scores. The scale column is what makes it credible.

### Additional sources
- https://www.info.gov.hk/gia/general/202503/17/P2025031400443p.htm
- https://www.legco.gov.hk/yr2025/english/panels/mp/papers/mp20250324cb1-410-4-e.pdf
- https://www.simmons-simmons.com/en/publications/cmrsvfcev004wtr54meqgtw0t/hk-proposes-work-injury-compensation-regime-for-platform-workers
- https://www.thestandard.com.hk/news/article/336920/HK-proposes-work-injury-protection-framework-for-digital-platform-delivery-workers
- https://www.scmp.com/news/hong-kong/hong-kong-economy/article/3360106/hong-kong-extend-injury-protection-gig-delivery-workers
- https://news.rthk.hk/rthk/en/component/k2/1861866-20260711.htm
- https://www.bowtie.com.hk/blog/en/insurance101/domestic-helper-hourly-rate-insurance/
- https://familyclic.hk/en/?p=733
- https://www.plataformamedia.com/2026/02/03/mais-de-1100-trabalhadores-estrangeiros-foram-contratados-em-2025/
- https://news.cgtn.com/news/2023-04-08/84m-workers-in-new-job-types-drive-focus-on-labor-social-security-1iPO16fb5II/share_amp.html
- https://chinaservicesinfo.com/s/202603/06/WS69aa96ab498e23165e06de81/new-forms-of-employment-set-to-receive-solid-govt-support.html
