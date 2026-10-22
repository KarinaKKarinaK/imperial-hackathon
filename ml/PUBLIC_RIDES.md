# False alarms on real two-wheeler rides (public data)

The shipped model (`out/model.json`) streamed over real riding from three public datasets, the way the app runs it: 6 s window every 1.5 s, threshold 0.5, at most one alarm per 60 s. Evaluation only. None of this data is trained on, mined or used to pick a threshold. Run on 23 Oct 2026. Reproduce from `ml/` with `python3 public_rides.py` (about 3 min, 8 workers) after downloading the files below into `ml/data/public_rides/` (gitignored, never committed).

## Datasets

| | SimRa Rides Berlin 08/23 - 03/24 | TU Wien motorcyclist IMU | UPCT e-scooter riding |
|---|---|---|---|
| Link | [DepositOnce](https://depositonce.tu-berlin.de/items/81888b21-cf3f-423d-a450-b474be021d9a), doi:10.14279/depositonce-20446 | [TU Wien Research Data](https://researchdata.tuwien.ac.at/records/re6xk-ydq75), doi:10.48436/re6xk-ydq75 | [Zenodo](https://zenodo.org/records/14851613), doi:10.5281/zenodo.14851613 |
| Licence | CC BY-NC 4.0 plus SimRa terms of use (no deanonymising, no linking rides to profiles) | CC BY 4.0 | CC BY 4.0 |
| Put at | `simra/Berlin_08_2023_03_2024.zip` | `tuwien/TrainingData.zip` | `upct_scooter/` (unzip, videos not needed) |
| Sensor | Rider's own phone, Android or iOS | Xsens MTi on a motorbike, mount position not stated | Android phone used as an on-board unit on the scooter |
| Placement | Pocket, jacket, bag, basket, handlebar, as the rider reported | Vehicle | Vehicle |
| Rate in the file | Android about 4 Hz, iOS about 10 Hz, both smoothed (below) | 50 Hz, raw | about 100 Hz, raw, with logger dropouts |
| Units | m/s^2 with gravity, converted to g | m/s^2 with gravity, converted to g | m/s^2 with gravity, converted to g |
| What we used | All 4,442 ride files, accelerometer X/Y/Z and time only. Profiles not read | All 10,271 clips, joined back into 845 behaviour runs (clips are 10 s every 5 s, overlap removed) | The 5 riding recordings for false alarms, the 9 staged overturn and collision recordings for detection |

Citations:
- Karakaya, A.-S., Bermbach, D. (2024). SimRa Rides Berlin 08/23 - 03/24. TU Berlin, DepositOnce. https://doi.org/10.14279/depositonce-20446
- Navratil, G., Giannopoulos, I. (2023). IMU Data for different Motorcyclist Behaviour (1.0.0). TU Wien. https://doi.org/10.48436/re6xk-ydq75
- jsanta-upct (2025). scooter-riding 1.0. Zenodo. https://doi.org/10.5281/zenodo.14851613

## Results, threshold 0.5

| | Riding time | False alarms | Per hour, Poisson 95% |
|---|---|---|---|
| SimRa, all phone placements | 1,849.7 h (Android 1,752.1, iOS 97.7) | 3 | **0.0016** [0.0003, 0.0047], so 1.6 per 1,000 h |
| TU Wien motorbike IMU | 15.27 h | 3 | **0.20** [0.04, 0.57] |
| UPCT scooter riding | 0.14 h | 0 | 0 [0, 25.9], too little data to say anything |

Where they fired:
- SimRa: all 3 on handlebar-mounted phones (223 h of handlebar riding). 0 alarms in 622 h of bag, 584 h of trouser pocket, 244 h of jacket pocket, 146 h of basket. Rides `VM2_-952029271`, `VM2_2020905850`, `VM2_931762240`.
- TU Wien: 2 in "traffic" (5.25 h), 1 in "fun" riding (3.21 h), 0 in cruise (5.76 h), waiting (0.92 h) or overtaking (0.12 h).
- SimRa near misses: riders labelled 3,985 incidents (close passes, dooring, hooks and so on) in 1,124 rides. No alarm within 10 s of any of them. Near misses are not crashes, so this is the right answer, but the smoothing below makes it easy.

Staged scooter falls (scooter only, no rider, onto mats or rugs, 5 repetitions per recording). The logger drops out for seconds at a time, so not every repetition is in the data. Of 37 impacts of 3 g or more that are in the data, a window over the impact scored 0.5 or more for 9. The app loop raised 6 alarms. Front collisions (2 recordings, 13 impacts): 0 flagged. This is a different event from a rider falling with the phone on them, and the model was never built for it.

## Why this is a real but imperfect test

- **Real riding, real roads, many riders.** That is the point: no generator, no volunteers acting.
- **SimRa is smoothed hard.** The Android app polls the sensor every 50 ms and writes the mean of the last 30 polls (1.5 s) every 5th poll, so about 4 rows a second. iOS writes a 0.6 s mean about 10 times a second (`RecorderService.java` and `Trip.m` in the simra-project GitHub repos). Our features resample to 50 Hz, but the spikes are already averaged away. The median SimRa ride never goes above 1.10 g, and only 5% of rides pass 2 g at all. On TU Wien, raw 50 Hz, the median run peaks at 1.92 g and 45% pass 2 g. So SimRa shows the model stays quiet on long, ordinary riding in many placements, but it hides the bumps and drops that cause false alarms. Treat 0.0016 per hour as a lower bound, not an estimate.
- **TU Wien is the stronger test.** Raw 50 Hz, real motorbike riding, including deliberately sporty "fun" riding. But the sensor is on the bike, not on the rider, and only 15 h. Three alarms in 15 h is about one every 5 h of riding.
- **Placement differs from UMAFall.** The model learned from a phone in a trouser pocket. A vehicle-mounted IMU sees road vibration directly and never sees the rider walk, sit or put the phone down. A phone in a bag is damped by the bag.
- **Riding time is recording time.** SimRa and TU Wien time includes stops at lights. Gaps over 2 s are not counted and windows never span them.
- **No real crashes.** None of the three has a real rider crash. The scooter falls are staged, riderless and on padding.

## Limits

- SimRa is one release (Aug 2023 to Mar 2024) of one city. Rides per person are not known to us, and the terms forbid trying to find out, so the interval treats every hour as independent.
- TU Wien clips were cut around behaviours from video. Long stretches between labelled behaviours are not in the data, so it is 15 h of selected riding, not 15 h of continuous shifts.
- The UPCT riding data is 8 minutes after removing logger dropouts. Do not quote a rate from it.
- A model that never fires would also score well here. Detection is measured on UMAFall and the synthetic set (see [STREAMING.md](STREAMING.md)), not on this data.
