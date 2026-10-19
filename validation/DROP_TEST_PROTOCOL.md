# Drop test protocol

Purpose: measure what the helmet sensor and the model see when a helmet hits a surface, and what they see when it does not. Produces the helmet column for the results table and the head-impact calibration for the triage thresholds.

What it proves: the detector sees a head impact from a given height. What it does not prove: that it sees every road crash. Say both on the poster.

## Rig

- Helmet with the sensor clip fitted, a 4.5 kg headform or a bag of rice taped inside to approximate head mass.
- Release by hand from a marked height, no throw. Flat concrete or a paving slab.
- Phone in a trouser pocket on the person dropping, running `/rider` on shift, so the phone column is recorded at the same time (it should not fire).
- Second phone filming at 60 fps for timing.

## Runs

| Set | Condition | Repeats | Expected |
|---|---|---|---|
| A | Drop 0.5 m onto concrete | 5 | impact, tilt, still: event |
| B | Drop 1.0 m onto concrete | 5 | event |
| C | Drop 1.5 m onto concrete | 5 | event |
| D | Drop 1.0 m, helmet lands and rolls | 5 | event |
| E | Helmet carried and set down hard on a table | 5 | no event |
| F | Helmet dropped into a backpack from 0.5 m | 5 | borderline, record what happens |
| G | Helmet worn, wearer jogs 30 s | 3 | no event |
| H | Helmet worn, wearer sits down hard on a bench | 5 | no event |
| I | Helmet worn, wearer bends to tie a shoe and stands | 5 | no event |
| J | Helmet tossed 0.3 m onto a sofa | 5 | no event |

Total 48 runs. One CSV per run named `set_condition_rep.csv`, for example `B_drop100_3.csv`.

## For each run record

- Set, repeat, height, surface, time.
- Peak g, tilt degrees, stillness seconds, model probability, event yes or no. The server prints all of these; copy from `/api/state`.
- Phone column: did the pocket phone fire. It should not.
- Anything odd.

## Analysis

- Detection rate per set with a Wilson 95% interval. With five repeats the interval is wide. Report it anyway.
- Peak g against drop height, with the published head-impact thresholds overlaid (Maalon supplies these with citations).
- False alarm count across sets E to J.
- Feed the CSVs to `ml/train.py --extra validation/` so the helmet runs join the training and the results table gets a helmet row.

## Safety

Nobody wears the helmet for sets A to F and J. Keep feet clear of the landing zone. Check the clip for cracks after every set.
