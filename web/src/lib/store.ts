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
import { flushStore, loadStore, persistenceEnabled, saveStore } from "./persist";
import demoWindows from "./ml/demo_windows.json";

type DemoWindow = { samples: [number, number, number, number][]; label: number };
const DEMO_WINDOWS = demoWindows as unknown as Record<string, DemoWindow>;
export const REPLAY_SCENARIOS = Object.keys(DEMO_WINDOWS);

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

type Serialized = { riders: [string, RiderState][]; events: EventRecord[]; sim: SimState | null };

// With Redis configured, every API request starts by loading the store, so
// all instances see the same state. Without Redis this is a no-op and the
// in-memory store on the instance is used. Call at the top of every handler.
export async function hydrate(): Promise<void> {
  if (!persistenceEnabled) return;
  const s = await loadStore<Serialized>();
  if (!s) return;
  store.riders = new Map(s.riders);
  store.events = s.events;
  store.sim = s.sim;
}

let dirty = false;
function persist() {
  dirty = true;
}

// Write once per request, after all mutations, and wait for it. Handlers call
// this right before they respond.
export async function flush(): Promise<void> {
  if (!dirty) return;
  dirty = false;
  await saveStore({ riders: [...store.riders.entries()], events: store.events, sim: store.sim } satisfies Serialized);
  await flushStore();
}

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
    lastDetection: null,
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
  persist();
  return r;
}

export function setContext(riderId: string, patch: Partial<Pick<RiderState, "rain" | "heat" | "platform">>) {
  const r = getRider(riderId);
  Object.assign(r, patch);
  r.lastSeenAt = Date.now();
  persist();
  return r;
}

export function cancelEvent(id: string): EventRecord | null {
  const e = store.events.find((x) => x.id === id);
  if (!e) return null;
  if (e.status === "detected" && Date.now() <= e.cancelDeadline) {
    e.status = "cancelled";
    persist();
  }
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
  r.lastDetection = { p: d.confidence, isCrash: d.isCrash, ruleFlag: d.ruleFlag, scenario: null, at: Date.now() };
  let event: EventRecord | null = null;
  const recent = store.events.find((e) => e.riderId === riderId && Date.now() - e.ts < 60_000);
  if (d.isCrash && r.onShift && !recent) {
    event = createEvent(r, d.confidence);
  }
  persist();
  return { rider: r, detection: d, event };
}

// Push one of the synthetic demo windows through the real detector for the
// demo rider. This is how the website shows a pothole, a hard brake or a bag
// drop not becoming an event, and a crash becoming one.
export function replay(scenario: string) {
  const w = DEMO_WINDOWS[scenario];
  if (!w) return null;
  const r = getRider(DEMO_RIDER);
  const base = Date.now() - 6000;
  const samples: Sample[] = w.samples.map(([t, ax, ay, az]) => ({ t: base + t * 1000, ax: ax * 9.81, ay: ay * 9.81, az: az * 9.81 }));
  const d = detectCrash(samples);
  r.lastWindow = d.stats;
  r.lastDetection = { p: d.confidence, isCrash: d.isCrash, ruleFlag: d.ruleFlag, scenario, at: Date.now() };
  r.lastSeenAt = Date.now();
  let event: EventRecord | null = null;
  const recent = store.events.find((e) => e.riderId === DEMO_RIDER && e.status === "detected" && Date.now() < e.cancelDeadline);
  if (d.isCrash && r.onShift && !recent) {
    if (store.sim) {
      store.sim.crashAt = Date.now();
      store.sim.crashFired = true;
    }
    r.speedKmh = 0;
    event = createEvent(r, d.confidence);
  }
  persist();
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
  persist();
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
  replay("crash");
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
  persist();
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
    s.crashFired = true;
  }
}

const ROUTE_SECONDS = 90;

export function snapshot(riderId: string) {
  advanceSim();
  tickDeadlines();
  const rider = getRider(riderId);
  const events = listEvents(riderId);
  const now = Date.now();
  // Other riders seen in the last two minutes, so a judge's phone shows up on
  // the same map as the scripted rider.
  const others = [...store.riders.values()].filter((r) => r.riderId !== riderId && now - r.lastSeenAt < 120_000);
  return {
    rider,
    events,
    others,
    allEvents: listEvents(),
    premiumWindowHkd: premiumWindowHkd(rider.rain, rider.heat, rider.fatigue),
    route: ROUTE,
    scenarios: REPLAY_SCENARIOS,
    serverTime: now,
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
