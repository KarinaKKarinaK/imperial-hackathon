// The work-injury event record. This is the standard: what a rider, a platform,
// an insurer and a court all read. Everything upstream of it is raw telemetry, checked and discarded,
// and stays with the rider.

export type Platform = "Platform A" | "Platform B";

export type Sample = {
  t: number; // ms since epoch
  ax: number; // m/s^2, device frame
  ay: number;
  az: number;
  gx?: number; // deg/s
  gy?: number;
  gz?: number;
};

export type HeatBand = "green" | "amber" | "red";

// An order the rider has accepted and not yet delivered. A third of Hong Kong
// riders run more than one app, so several can be open at the moment of impact.
export type ActiveJob = { platform: Platform; jobId: string; acceptedAt: number };

export type SensorSource = "phone" | "helmet";

export type RiderState = {
  riderId: string;
  onShift: boolean;
  platform: Platform;
  jobId: string | null;
  jobs: ActiveJob[]; // every open order across apps; platform and jobId mirror the most recent
  keyHash?: string | null; // sha256 of the rider's device key, never sent to a client
  lat: number;
  lng: number;
  speedKmh: number;
  rain: boolean;
  heat: HeatBand;
  fatigue: number; // 0..1 heuristic
  shiftStartedAt: number | null;
  deadlineAt: number | null; // when the current order is due, ms since epoch
  emergencyContact: string | null; // phone number held on the device, mirrored for the demo rider only
  lastSeenAt: number;
  lastCell?: string | null;
  research?: boolean; // opted in to donate labelled sensor windows, separate from the shift consent
  lastRideDonationAt?: number | null; // hazard grid cell last passed, so a pass is counted once per cell
  lastWindow: WindowStats | null;
  lastDetection: LastDetection | null;
};

export type LastDetection = {
  p: number; // model probability of a crash
  isCrash: boolean;
  ruleFlag: boolean; // what the three-threshold rule would have said
  scenario: string | null; // set when the window came from a replay
  at: number;
};

export type WindowStats = {
  peakG: number;
  tiltDeg: number;
  stillSec: number;
  sampleCount: number;
};

export type EventStatus = "detected" | "cancelled" | "confirmed" | "paid";

export type EventRecord = {
  id: string;
  riderId: string;
  platform: Platform; // the app whose order was accepted most recently
  jobId: string | null;
  activeJobs: ActiveJob[]; // every app with an open order at impact
  apportionment: { platform: Platform; share: number }[]; // liability split, shares sum to 1
  sources: SensorSource[]; // which sensors agreed on the impact
  prevHash: string | null; // sha256 of this rider's previous record, so a deleted record leaves a gap
  ts: number;
  deadlineSec: number | null; // seconds left on the delivery countdown at impact, negative if already late
  mode: "motorcycle" | "bicycle" | "walking" | "unknown";
  lat: number;
  lng: number;
  peakG: number;
  tiltDeg: number;
  stillSec: number;
  confidence: number; // 0..1
  status: EventStatus;
  cancelDeadline: number; // ts + 30s
  triage: {
    profile: string;
    mechanism: string;
  };
  insurance: {
    premiumWindowHkd: number;
    payoutHkd: number;
    paidAt: number | null;
  };
  context: {
    rain: boolean;
    heat: HeatBand;
    fatigue: number;
  };
  signature: string | null; // Ed25519 over the impact facts, base64url. Verify at /api/verify
  // Signed once the outcome is final, so status and payout cannot be edited either.
  settlement: Settlement | null;
  // Tier two: a hospital admission the rider submits after a paid event.
  // Signed on receipt; the insurer confirms it with the hospital.
  hospital?: HospitalClaim | null;
  // After a cancel the rider can say what it was. A weak label for retraining.
  feedback?: Feedback | null;
  sample?: boolean; // a seeded example so empty screens are not blank. Never a real rider
};

export type Feedback = "false_alarm" | "real_fall" | "unsure";

export type HospitalClaim = {
  hospital: string;
  admittedAt: number;
  dischargeRef: string;
  submittedAt: number;
  status: "submitted" | "confirmed";
  signature: string; // Ed25519 over id, hospital, admittedAt, dischargeRef, submittedAt and the facts signature
};

export type Settlement = {
  status: "cancelled" | "paid";
  paidAt: number | null;
  payoutHkd: number;
  at: number;
  signature: string; // Ed25519 over id, status, paidAt, payoutHkd, at and the facts signature
};

// De-identified hazard cell: non-crash impacts and hard brakes aggregated to
// a grid of roughly 50 m. Never carries a rider id.
export type HazardCell = {
  cell: string; // "lat,lng" rounded to 4 decimals
  lat: number;
  lng: number;
  bumps: number;
  brakes: number;
  lastAt: number;
  passes?: number; // rider passes through the cell, so jolts can be read as a rate
  rate?: number; // jolts per pass, shrunk toward the city mean (empirical Bayes)
};
