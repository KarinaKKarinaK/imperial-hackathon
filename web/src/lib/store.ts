import type { EventRecord, Platform, RiderState, Sample } from "./schema";
import {
  detectCrash,
  fatigueScore,
  FIXED_PAYOUT_HKD,
  premiumWindowHkd,
  THRESHOLDS,
  triageProfile,
} from "./detector";
import { ROUTE, pointAt } from "./route";

// ponytail: in-memory store on a single warm instance. Enough for a demo on
// Fluid Compute. Swap for Supabase or Redis when two instances must agree.
type Store = {
  riders: Map<string, RiderState>;
  events: EventRecord[];
  sim: SimState | null;
};

type SimState = {
  riderId: string;
  startedAt: number;
  crashAt: number | null;
  crashFired: boolean;
  okTapped: boolean;
};

const g = globalThis as unknown as { __mf_store?: Store };
const store: Store =
  g.__mf_store ?? (g.__mf_store = { riders: new Map(), events: [], sim: null });

export const DEMO_RIDER = "rider-demo";

function newRider(riderId: string): RiderState {
  const p = pointAt(0);
  return {
    riderId,
    onShift: false,
    platform: "Platform A",
    jobId: null,
    lat: p[1],
    lng: p[0],
    speedKmh: 0,
    rain: false,
    heat: "green",
    fatigue: 0,
    shiftStartedAt: null,
    lastSeenAt: Date.now(),
    lastWindow: null,
  };
}

export function getRider(riderId: string): RiderState {
  let r = store.riders.get(riderId);
  if (!r) {
    r = newRider(riderId);
    store.riders.set(riderId, r);
  }
  return r;
}

export function listEvents(riderId?: string): EventRecord[] {
  tickDeadlines();
  const all = riderId ? store.events.filter((e) => e.riderId === riderId) : store.events;
  return [...all].sort((a, b) => b.ts - a.ts);
}

// Events past the cancel window with no tap become confirmed and paid.
function tickDeadlines() {
  const now = Date.now();
  for (const e of store.events) {
    if (e.status === "detected" && now > e.cancelDeadline) {
      e.status = "paid";
      e.insurance.paidAt = now;
    }
  }
}

export function setShift(riderId: string, onShift: boolean, platform?: Platform) {
  const r = getRider(riderId);
  r.onShift = onShift;
  if (platform) r.platform = platform;
  r.shiftStartedAt = onShift ? r.shiftStartedAt ?? Date.now() : null;
  r.jobId = onShift ? r.jobId ?? `ORD-${Math.floor(1000 + Math.random() * 9000)}` : null;
  r.lastSeenAt = Date.now();
  return r;
}

export function setContext(riderId: string, patch: Partial<Pick<RiderState, "rain" | "heat" | "platform">>) {
  const r = getRider(riderId);
  Object.assign(r, patch);
  r.lastSeenAt = Date.now();
  return r;
}

export function cancelEvent(id: string): EventRecord | null {
  const e = store.events.find((x) => x.id === id);
  if (!e) return null;
  if (e.status === "detected" && Date.now() <= e.cancelDeadline) e.status = "cancelled";
  return e;
}

export function ingest(riderId: string, samples: Sample[], pos?: { lat: number; lng: number; speedKmh?: number }) {
  const r = getRider(riderId);
  r.lastSeenAt = Date.now();
  if (pos) {
    r.lat = pos.lat;
    r.lng = pos.lng;
    if (pos.speedKmh !== undefined) r.speedKmh = pos.speedKmh;
  }
  const hours = r.shiftStartedAt ? (Date.now() - r.shiftStartedAt) / 3.6e6 : 0;
  r.fatigue = fatigueScore(hours, 0);
  const d = detectCrash(samples);
  r.lastWindow = d.stats;
  let event: EventRecord | null = null;
  const recent = store.events.find((e) => e.riderId === riderId && Date.now() - e.ts < 60_000);
  if (d.isCrash && r.onShift && !recent) {
    event = createEvent(r, d.confidence);
  }
  return { rider: r, detection: d, event };
}

function createEvent(r: RiderState, confidence: number): EventRecord {
  const now = Date.now();
  const stats = r.lastWindow ?? { peakG: 0, tiltDeg: 0, stillSec: 0, sampleCount: 0 };
  const e: EventRecord = {
    id: `EVT-${now.toString(36).toUpperCase()}`,
    riderId: r.riderId,
    platform: r.platform,
    jobId: r.jobId,
    ts: now,
    lat: r.lat,
    lng: r.lng,
    peakG: Number(stats.peakG.toFixed(1)),
    tiltDeg: Math.round(stats.tiltDeg),
    stillSec: Number(stats.stillSec.toFixed(1)),
    confidence,
    status: "detected",
    cancelDeadline: now + THRESHOLDS.cancelWindowSec * 1000,
    triage: triageProfile(stats.peakG, r.speedKmh),
    insurance: {
      premiumWindowHkd: premiumWindowHkd(r.rain, r.heat, r.fatigue),
      payoutHkd: FIXED_PAYOUT_HKD,
      paidAt: null,
    },
    context: { rain: r.rain, heat: r.heat, fatigue: r.fatigue },
  };
  store.events.unshift(e);
  if (store.events.length > 200) store.events.length = 200;
  return e;
}

// Scripted demo: a rider moves along the route; a crash can be fired.
export function simStart() {
  const r = getRider(DEMO_RIDER);
  setShift(DEMO_RIDER, true, r.platform);
  store.sim = { riderId: DEMO_RIDER, startedAt: Date.now(), crashAt: null, crashFired: false, okTapped: false };
  return snapshot(DEMO_RIDER);
}

export function simCrash() {
  if (!store.sim) simStart();
  store.sim!.crashAt = Date.now();
  return snapshot(DEMO_RIDER);
}

export function simOk() {
  const e = listEvents(DEMO_RIDER)[0];
  if (e) cancelEvent(e.id);
  if (store.sim) store.sim.okTapped = true;
  return snapshot(DEMO_RIDER);
}

export function simReset() {
  store.sim = null;
  store.riders.delete(DEMO_RIDER);
  store.events = store.events.filter((e) => e.riderId !== DEMO_RIDER);
  return snapshot(DEMO_RIDER);
}

// Advance the scripted rider. Called on every GET so no timers are needed.
function advanceSim() {
  const s = store.sim;
  if (!s) return;
  const r = getRider(s.riderId);
  const crashed = s.crashAt !== null;
  if (!crashed) {
    const elapsed = (Date.now() - s.startedAt) / 1000;
    const u = (elapsed / ROUTE_SECONDS) % 1;
    const p = pointAt(u);
    r.lng = p[0];
    r.lat = p[1];
    r.speedKmh = r.rain ? 22 : 28;
  } else if (!s.crashFired) {
    r.speedKmh = 0;
    r.lastWindow = { peakG: 14.2, tiltDeg: 82, stillSec: 8, sampleCount: 100 };
    createEvent(r, 0.97);
    s.crashFired = true;
  }
}

const ROUTE_SECONDS = 90;

export function snapshot(riderId: string) {
  advanceSim();
  tickDeadlines();
  const rider = getRider(riderId);
  const events = listEvents(riderId);
  return {
    rider,
    events,
    premiumWindowHkd: premiumWindowHkd(rider.rain, rider.heat, rider.fatigue),
    route: ROUTE,
    serverTime: Date.now(),
  };
}

export function allSnapshot() {
  advanceSim();
  tickDeadlines();
  return {
    riders: [...store.riders.values()],
    events: listEvents(),
    serverTime: Date.now(),
  };
}
