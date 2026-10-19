import assert from "node:assert/strict";
import test from "node:test";
import { detectCrash, heatBand, premiumWindowHkd } from "./detector";
import type { Sample } from "./schema";

const G = 9.81;

function ride(n: number, t0 = 0): Sample[] {
  // Upright, small vibration.
  return Array.from({ length: n }, (_, i) => ({
    t: t0 + i * 10,
    ax: (Math.sin(i) * 0.3),
    ay: (Math.cos(i) * 0.3),
    az: G + Math.sin(i * 0.7) * 0.4,
  }));
}

function crash(): Sample[] {
  const before = ride(40);
  const impact: Sample[] = [{ t: 400, ax: 60, ay: 20, az: 130 }];
  // Lying on the side: gravity now on x. Still for 4 seconds.
  const after: Sample[] = Array.from({ length: 400 }, (_, i) => ({
    t: 420 + i * 10,
    ax: G,
    ay: 0.05,
    az: 0.05,
  }));
  return [...before, ...impact, ...after];
}

test("a crash is impact, fall, stillness in sequence", () => {
  const d = detectCrash(crash());
  assert.equal(d.isCrash, true);
  assert.ok(d.stats.peakG > 6);
  assert.ok(d.stats.tiltDeg > 60);
  assert.ok(d.stats.stillSec >= 3);
  assert.ok(d.confidence > 0.9);
});

test("normal riding is not a crash", () => {
  const d = detectCrash(ride(500));
  assert.equal(d.isCrash, false);
});

test("a hard set-down with no fall is not a crash", () => {
  const before = ride(40);
  const impact: Sample[] = [{ t: 400, ax: 5, ay: 5, az: 90 }];
  const after = ride(400, 420);
  const d = detectCrash([...before, ...impact, ...after]);
  assert.equal(d.isCrash, false);
});

test("heat bands follow the index", () => {
  assert.equal(heatBand(24, 50), "green");
  assert.equal(heatBand(32, 75), "amber");
  assert.equal(heatBand(36, 80), "red");
});

test("premium rises with exposure", () => {
  const calm = premiumWindowHkd(false, "green", 0);
  const rough = premiumWindowHkd(true, "red", 0.8);
  assert.ok(rough > calm);
});
