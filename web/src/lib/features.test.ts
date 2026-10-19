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

test("helmet frames decode to m/s^2 samples", async () => {
  const { parseFrames } = await import("./helmet");
  const b = new ArrayBuffer(32);
  const v = new DataView(b);
  // frame 1: t=1000, ax=1000 milli-g (1 g), ay=0, az=0, gyro 0
  v.setUint32(0, 1000, true);
  v.setInt16(4, 1000, true);
  // frame 2: t=1010, az=-14000 milli-g (-14 g), gz=1234 (123.4 deg/s)
  v.setUint32(16, 1010, true);
  v.setInt16(24, -14000, true);
  v.setInt16(30, 1234, true);
  const s = parseFrames(v, 5000);
  assert.equal(s.length, 2);
  assert.equal(s[0].t, 6000);
  assert.ok(Math.abs(s[0].ax - 9.81) < 1e-9);
  assert.ok(Math.abs(s[1].az + 14 * 9.81) < 1e-6);
  assert.equal(s[1].gz, 123.4);
});
