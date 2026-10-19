// The work-injury event record. This is the standard: what a rider, a platform,
// an insurer and a court all read. Everything upstream of it is raw telemetry
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

export type RiderState = {
  riderId: string;
  onShift: boolean;
  platform: Platform;
  jobId: string | null;
  lat: number;
  lng: number;
  speedKmh: number;
  rain: boolean;
  heat: HeatBand;
  fatigue: number; // 0..1 heuristic
  shiftStartedAt: number | null;
  lastSeenAt: number;
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
  platform: Platform;
  jobId: string | null;
  ts: number;
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
};
