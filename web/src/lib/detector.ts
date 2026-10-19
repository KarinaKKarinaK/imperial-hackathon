import type { HeatBand, Sample, WindowStats } from "./schema";
import { features } from "./features";
import { crashProbability, MODEL, MODEL_THRESHOLD } from "./model";

// Thresholds of the original rule. Kept for display, for the explanation
// panel, and as the baseline row in ml/out/results.md. Detection itself is
// the gradient boosting model in model.ts.
export const THRESHOLDS = {
  impactG: 6,
  tiltDeg: 60,
  stillSec: 3,
  cancelWindowSec: 30,
};

export type Detection = {
  isCrash: boolean;
  confidence: number; // model probability
  ruleFlag: boolean; // what the old rule would have said
  stats: WindowStats;
  features: number[];
  model: string;
};

export function detectCrash(samples: Sample[]): Detection {
  const f = features(samples);
  const [peakG, , , , tiltDeg, stillSec] = f;
  const p = samples.length >= 5 ? crashProbability(f) : 0;
  const ruleFlag = peakG >= THRESHOLDS.impactG && tiltDeg >= THRESHOLDS.tiltDeg && stillSec >= THRESHOLDS.stillSec;
  return {
    isCrash: p >= MODEL_THRESHOLD,
    confidence: Number(p.toFixed(3)),
    ruleFlag,
    stats: { peakG, tiltDeg, stillSec, sampleCount: samples.length },
    features: f,
    model: MODEL.kind,
  };
}

// Probable trauma profile from mechanism and magnitude. Labelled probable,
// never a diagnosis. Thresholds to be cited to the biomechanics literature
// in the evidence table.
export function triageProfile(peakG: number, speedKmh: number): { profile: string; mechanism: string } {
  const mechanism =
    speedKmh > 30 ? "High-speed deceleration" : speedKmh > 10 ? "Moderate-speed deceleration" : "Low-speed fall";
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
