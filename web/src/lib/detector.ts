import type { HeatBand, Sample, WindowStats } from "./schema";

const G = 9.81;

// Thresholds. Start points from fall-detection and helmet-impact literature,
// to be refit on our own drop-test data. Keep them in one place so the poster
// and the code agree.
export const THRESHOLDS = {
  impactG: 6, // peak resultant acceleration, in g
  tiltDeg: 60, // orientation change after impact
  stillSec: 3, // near-zero motion after the fall
  stillG: 0.25, // |resultant - 1g| below this counts as still
  cancelWindowSec: 30,
};

export function resultantG(s: Sample): number {
  return Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az) / G;
}

// Angle between the gravity vector before and after the window, from the
// low-pass mean of the first and last 20% of samples.
function tiltBetween(a: Sample[], b: Sample[]): number {
  const mean = (arr: Sample[]) => {
    const m = { x: 0, y: 0, z: 0 };
    for (const s of arr) {
      m.x += s.ax;
      m.y += s.ay;
      m.z += s.az;
    }
    const n = Math.max(arr.length, 1);
    return { x: m.x / n, y: m.y / n, z: m.z / n };
  };
  const u = mean(a);
  const v = mean(b);
  const nu = Math.hypot(u.x, u.y, u.z) || 1;
  const nv = Math.hypot(v.x, v.y, v.z) || 1;
  const cos = Math.min(1, Math.max(-1, (u.x * v.x + u.y * v.y + u.z * v.z) / (nu * nv)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function windowStats(samples: Sample[]): WindowStats {
  if (samples.length === 0) return { peakG: 0, tiltDeg: 0, stillSec: 0, sampleCount: 0 };
  const sorted = [...samples].sort((p, q) => p.t - q.t);
  let peakG = 0;
  let peakIdx = 0;
  sorted.forEach((s, i) => {
    const r = resultantG(s);
    if (r > peakG) {
      peakG = r;
      peakIdx = i;
    }
  });
  // Gravity direction before the peak versus after it settles.
  const head = sorted.slice(Math.max(0, peakIdx - 50), Math.max(1, peakIdx));
  const tail = sorted.slice(Math.min(sorted.length - 1, peakIdx + 10));
  const tiltDeg = head.length && tail.length ? tiltBetween(head, tail) : 0;

  // Stillness: longest run after the peak where |r - 1g| < stillG.
  let stillMs = 0;
  let runStart: number | null = null;
  for (let i = peakIdx + 1; i < sorted.length; i++) {
    const still = Math.abs(resultantG(sorted[i]) - 1) < THRESHOLDS.stillG;
    if (still && runStart === null) runStart = sorted[i].t;
    if (!still && runStart !== null) {
      stillMs = Math.max(stillMs, sorted[i - 1].t - runStart);
      runStart = null;
    }
  }
  if (runStart !== null) stillMs = Math.max(stillMs, sorted[sorted.length - 1].t - runStart);

  return { peakG, tiltDeg, stillSec: stillMs / 1000, sampleCount: sorted.length };
}

export type Detection = {
  isCrash: boolean;
  confidence: number;
  stats: WindowStats;
};

// Three signals in sequence: impact, fall, stillness. Confidence is the
// product of how far each signal clears its threshold, capped at 1.
export function detectCrash(samples: Sample[]): Detection {
  const stats = windowStats(samples);
  const impact = Math.min(1, stats.peakG / THRESHOLDS.impactG);
  const fall = Math.min(1, stats.tiltDeg / THRESHOLDS.tiltDeg);
  const still = Math.min(1, stats.stillSec / THRESHOLDS.stillSec);
  const isCrash =
    stats.peakG >= THRESHOLDS.impactG &&
    stats.tiltDeg >= THRESHOLDS.tiltDeg &&
    stats.stillSec >= THRESHOLDS.stillSec;
  const confidence = Number((impact * fall * still).toFixed(2));
  return { isCrash, confidence, stats };
}

// Probable trauma profile from mechanism and magnitude. Labelled probable,
// never a diagnosis. Thresholds to be cited to the biomechanics literature
// in the evidence table.
export function triageProfile(peakG: number, speedKmh: number): { profile: string; mechanism: string } {
  const mechanism =
    speedKmh > 30
      ? "High-speed deceleration"
      : speedKmh > 10
        ? "Moderate-speed deceleration"
        : "Low-speed fall";
  if (peakG >= 20) return { profile: "Probable severe head impact. Suspect intracranial injury.", mechanism };
  if (peakG >= 12) return { profile: "Probable blunt force trauma. Suspect concussion, limb fracture.", mechanism };
  return { profile: "Probable minor blunt trauma. Assess for concussion.", mechanism };
}

// Fatigue heuristic 0..1: continuous hours on shift plus speed variance.
// ponytail: heuristic, not a validated clinical measure. Say so on screen.
export function fatigueScore(hoursOnShift: number, speedVariance: number): number {
  const hours = Math.min(1, hoursOnShift / 10);
  const erratic = Math.min(1, speedVariance / 50);
  return Number(Math.min(1, 0.7 * hours + 0.3 * erratic).toFixed(2));
}

// Heat band from temperature and humidity. Steadman apparent temperature
// (no wind term), banded to mirror the three Labour Department warning tiers.
export function heatBand(tempC: number, humidityPct: number): HeatBand {
  const t = tempC;
  const rh = humidityPct;
  const hi = t + 0.33 * (rh / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t)) - 4;
  if (hi >= 41) return "red";
  if (hi >= 33) return "amber";
  return "green";
}

// Premium for one 20-minute delivery window, HK dollars. Base rate times
// exposure multipliers. Numbers are illustrative until the business model
// supplies sourced ones.
export function premiumWindowHkd(rain: boolean, heat: HeatBand, fatigue: number): number {
  const base = 0.6;
  const rainM = rain ? 1.4 : 1;
  const heatM = heat === "red" ? 1.5 : heat === "amber" ? 1.2 : 1;
  const fatigueM = 1 + 0.5 * fatigue;
  return Number((base * rainM * heatM * fatigueM).toFixed(2));
}

export const FIXED_PAYOUT_HKD = 8000;
