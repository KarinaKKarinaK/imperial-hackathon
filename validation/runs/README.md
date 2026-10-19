# Drop test runs

One CSV per run, named `SET_condition_rep.csv`, for example `B_drop100_3.csv`. Set letters follow `../DROP_TEST_PROTOCOL.md`: A to D are impacts, E to J are controls.

Columns, with a header row: `t_ms,ax,ay,az,gx,gy,gz`. Acceleration in g, gyroscope in deg/s. The firmware's serial log prints exactly this.

Run `python3 train.py --extra ../validation/runs` from `ml/`. The helmet rows appear in `out/results.md` and, after copying the JSON files to `web/src/lib/ml/`, on the site.
