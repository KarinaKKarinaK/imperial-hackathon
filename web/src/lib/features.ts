// Window features for the crash detector. A port of ml/features.py. The two
// must agree to the last decimal: ml/out/parity.json holds windows with the
// Python features and probabilities, and features.test.ts checks this file
// against them.

import type { Sample } from "./schema";

export const RATE_HZ = 50;
export const WINDOW_S = 6;
const STILL_BAND_G = 0.25;
const G = 9.81;

export const FEATURE_NAMES = [
  "peak_g",
  "min_g",
  "pre_std",
  "post_std",
  "tilt_deg",
  "still_s",
  "jerk_max",
  "above_2g_s",
  "lag_s",
  "energy",
] as const;

// [t_seconds, ax, ay, az] in g
export type Row = [number, number, number, number];

export function rowsFromSamples(samples: Sample[]): Row[] {
  // Samples arrive in m/s^2 with millisecond timestamps.
  return samples.map((s) => [s.t / 1000, s.ax / G, s.ay / G, s.az / G]);
}

export function resample(rows: Row[], rateHz = RATE_HZ): Row[] {
  const s = [...rows].sort((a, b) => a[0] - b[0]);
  if (s.length < 2 || s[s.length - 1][0] - s[0][0] <= 0) return s;
  const t0 = s[0][0];
  const t1 = s[s.length - 1][0];
  const out: Row[] = [];
  let j = 0;
  // np.arange(t0, t1, 1/rate): strictly less than t1
  const step = 1 / rateHz;
  const n = Math.ceil((t1 - t0) / step - 1e-12);
  for (let i = 0; i < n; i++) {
    const t = t0 + i * step;
    if (t >= t1) break;
    while (j < s.length - 2 && s[j + 1][0] <= t) j++;
    const a = s[j];
    const b = s[j + 1];
    const f = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
    out.push([t, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f]);
  }
  return out;
}

function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / xs.length);
}

function angle(u: number[], v: number[]): number {
  const nu = Math.hypot(u[0], u[1], u[2]) || 1;
  const nv = Math.hypot(v[0], v[1], v[2]) || 1;
  const c = Math.min(1, Math.max(-1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (nu * nv)));
  return (Math.acos(c) * 180) / Math.PI;
}

function meanVec(rows: Row[]): number[] {
  const m = [0, 0, 0];
  for (const r of rows) {
    m[0] += r[1];
    m[1] += r[2];
    m[2] += r[3];
  }
  const n = Math.max(rows.length, 1);
  return [m[0] / n, m[1] / n, m[2] / n];
}

export function featuresFromRows(rows: Row[], rateHz = RATE_HZ): number[] {
  const s = resample(rows, rateHz);
  const n = s.length;
  if (n < 5) return new Array(FEATURE_NAMES.length).fill(0);
  const dt = 1 / rateHz;
  const r = s.map((x) => Math.hypot(x[1], x[2], x[3]));
  let p = 0;
  for (let i = 1; i < n; i++) if (r[i] > r[p]) p = i;
  const peak = r[p];

  const pre = r.slice(0, Math.max(p, 1));
  let minIdx = 0;
  for (let i = 1; i < pre.length; i++) if (pre[i] < pre[minIdx]) minIdx = i;
  const minG = pre[minIdx];
  const lagS = p > 0 ? (p - minIdx) * dt : 0;

  const preWin = r.slice(Math.max(0, p - Math.floor(1.5 * rateHz)), Math.max(p, 1));
  const preStd = std(preWin);

  const postStart = Math.min(n - 1, p + Math.floor(1.0 * rateHz));
  const postStd = std(r.slice(postStart));

  const gBefore = meanVec(s.slice(Math.max(0, p - Math.floor(1.0 * rateHz)), Math.max(p, 1)));
  const tail = s.slice(Math.min(n - 1, p + Math.floor(0.5 * rateHz)));
  const gAfter = tail.length ? meanVec(tail) : gBefore;
  const tilt = angle(gBefore, gAfter);

  let best = 0;
  let run = 0;
  for (let i = p + 1; i < n; i++) {
    run = Math.abs(r[i] - 1) < STILL_BAND_G ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const stillS = best * dt;

  let jerk = 0;
  for (let i = 1; i < n; i++) jerk = Math.max(jerk, Math.abs(r[i] - r[i - 1]) / dt);
  let above = 0;
  let energy = 0;
  for (const v of r) {
    if (v > 2) above++;
    energy += (v - 1) * (v - 1);
  }
  return [peak, minG, preStd, postStd, tilt, stillS, jerk, above * dt, lagS, energy / n];
}

export function features(samples: Sample[]): number[] {
  return featuresFromRows(rowsFromSamples(samples));
}
