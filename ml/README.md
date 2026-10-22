# Crash detector

Trains and evaluates the crash detector, exports it for the web app, and keeps the TypeScript port honest with parity vectors.

## Data

- **UMAFall** (Casilari and Santoyo-Ramon, Universidad de Malaga, CC BY 4.0). 19 subjects, 12 activities of daily living, 3 fall types, 746 trials. We use the smartphone accelerometer (right trouser pocket, about 200 Hz), which is the closest public recording to the phone our rider carries. Download with the command below. Cite the dataset paper (Procedia Computer Science, 2017) and the Sensors 2018 paper.
- **Synthetic rider scenarios** (`synthetic.py`). Riding, hard braking, potholes, setting the phone down, a phone falling in a bag, and crashes. Generated, labelled, and used only for domain-shift testing and the website replay buttons. They are a model of the signal, not the world.
- **Drop tests** (`validation/`). The helmet column, once the rig runs. `train.py --extra validation/` folds them in.

```
mkdir -p data && curl -L -o data/umafall.zip https://ndownloader.figshare.com/files/43076140
unzip -q data/umafall.zip -d data/umafall
```

## Run

```
pip install -r requirements.txt
python train.py            # about 3 minutes on a laptop CPU
```

Outputs in `out/`:

| File | What |
|---|---|
| `results.md`, `results.json` | Leave-subjects-out metrics with bootstrap CIs, synthetic domain-shift table, failure table |
| `model.json` | Scaler, gradient boosting trees and MLP weights, ready for `web/src/lib/model.ts` |
| `parity.json` | Nine windows with Python features and probabilities. `web/src/lib/features.test.ts` checks the TypeScript port against them |
| `demo_windows.json` | One window per synthetic scenario for the replay buttons on `/demo` |

Copy the four files to `web/src/lib/ml/` after a run.

## Method

Ten window features (peak g, pre-peak minimum, pre and post standard deviation, tilt angle, stillness run, max jerk, time above 2 g, free-fall to impact lag, energy) computed on a 6 second window resampled to 50 Hz. Five detectors: the original three-threshold rule as baseline, logistic regression, histogram gradient boosting, a 10-16-1 MLP (PyTorch) and a 1D CNN on the raw window (PyTorch). GroupKFold by subject so no person appears in both train and test. Metrics bootstrapped over trials, 1000 resamples.

Gradient boosting also gets hard negative mining (`mining.py`): the app's 6 s window, every 1.5 s, is slid over the daily activity recordings of the training subjects, and windows scored 0.2 or above become extra negatives, two rounds. Inside each fold only that fold's training subjects are mined; the export mines all of them. `python train.py --mine-rounds 0` gives the unmined model.

Gradient boosting is deployed. Its trees are exported as JSON and evaluated in a few lines of TypeScript on the server and on the phone, so the browser demo and the API use the same model that produced the results table.

## Results

See `out/results.md`. Headline on the current run: the rule catches 48% of falls, gradient boosting catches 93% at 93% precision, AUROC 0.992, leave-subjects-out, trained exactly as shipped (UMAFall plus synthetic rider windows). The worst false alarm for every model is a phone taken out of a pocket to make a call, which is why the 30 second cancel window exists.

In the app's live loop (`python3 stream_eval.py`, see `STREAMING.md`) the mined model raises 10.5 false alarms per hour of daily activity [6.2, 16.5], down from 19.2 unmined, and catches 200 of 208 falls, median 2.1 s after impact. All remaining false alarms are a phone taken out for a call.

## Field data

Put app recordings in `data/field/*.json` (gitignored), one segment per file: `{"id", "kind": "ride"|"event", "label": "riding"|"crash"|"false_alarm"|"real_fall"|"unsure", "source": "phone"|"helmet", "durationS", "samples": [[t_s, ax_g, ay_g, az_g], ...]}`. `stream_eval.py` streams the shipped `out/model.json` over every ride for false alarms per riding hour and scores every labelled event. Never trained on.

## Notebook

`explore.ipynb` walks through loading, features, one fold and the plots. The numbers that matter come from `train.py`.
