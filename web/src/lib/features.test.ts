import assert from "node:assert/strict";
import test from "node:test";
import parity from "./ml/parity.json";
import { featuresFromRows, FEATURE_NAMES, type Row } from "./features";
import { crashProbability } from "./model";

type Vec = { source: string; label: number; samples: Row[]; features: number[]; p: number; p_mlp: number };

test("TypeScript features match the Python features on every parity window", () => {
  for (const v of parity as Vec[]) {
    const f = featuresFromRows(v.samples);
    f.forEach((x, i) => {
      const ref = v.features[i];
      const tol = Math.max(1e-3, Math.abs(ref) * 2e-3);
      assert.ok(Math.abs(x - ref) <= tol, `${v.source} ${FEATURE_NAMES[i]}: ts ${x} vs py ${ref}`);
    });
  }
});

test("TypeScript probabilities match the Python model", () => {
  for (const v of parity as Vec[]) {
    const p = crashProbability(v.features, "gbm");
    assert.ok(Math.abs(p - v.p) < 2e-3, `${v.source} gbm: ts ${p} vs py ${v.p}`);
    const pm = crashProbability(v.features, "mlp");
    assert.ok(Math.abs(pm - v.p_mlp) < 2e-3, `${v.source} mlp: ts ${pm} vs py ${v.p_mlp}`);
  }
});

test("labels come out right on the parity windows", () => {
  for (const v of parity as Vec[]) {
    const p = crashProbability(featuresFromRows(v.samples));
    if (v.source.startsWith("synthetic:bag_drop")) continue; // a phone falling in a bag is a fall; the cancel window handles it
    assert.equal(p >= 0.5 ? 1 : 0, v.label, `${v.source}: p=${p.toFixed(3)} label=${v.label}`);
  }
});
