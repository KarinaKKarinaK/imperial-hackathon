import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import type { ActiveJob, EventRecord, Feedback, HazardCell, Platform, RiderState, Sample, SensorSource } from "./schema";
import { recordHash, signHospital, signRecord, signSettlement } from "./sign";
import {
  detectCrash,
  fatigueScore,
  FIXED_PAYOUT_HKD,
  premiumWindowHkd,
  THRESHOLDS,
  triageProfile,
  type Detection,
} from "./detector";
import { ROUTE, pointAt } from "./route";
import { deleteField, loadStore, persistenceEnabled, pushField, saveStore, StoreConflict } from "./persist";
import demoWindows from "./ml/demo_windows.json";

type DemoWindow = { samples: [number, number, number, number][]; label: number };
const DEMO_WINDOWS = demoWindows as unknown as Record<string, DemoWindow>;
export const REPLAY_SCENARIOS = Object.keys(DEMO_WINDOWS);

// One JSON blob, loaded at the start of every request and saved with a
// version check at the end (see persist.ts). Without Redis it lives in memory.
type Store = {
  riders: Map<string, RiderState>;
  events: EventRecord[];
  sim: SimState | null;
  hazards: Map<string, HazardCell>;
  field: FieldStats;
};

// Counters for donated windows. The windows themselves live in a separate
// Redis list (persist.ts); these are what /labour shows.
export type FieldStats = { rides: number; rideSeconds: number; events: number; labels: Record<string, number> };
const emptyField = (): FieldStats => ({ rides: 0, rideSeconds: 0, events: 0, labels: {} });

type SimState = {
  riderId: string;
  startedAt: number;
  crashAt: number | null;
  crashFired: boolean;
  okTapped: boolean;
};

const g = globalThis as unknown as { __mf_store?: Store };
const store: Store =
  g.__mf_store ?? (g.__mf_store = { riders: new Map(), events: [], sim: null, hazards: new Map(), field: emptyField() });

type Serialized = { riders: [string, RiderState][]; events: EventRecord[]; sim: SimState | null; hazards?: [string, HazardCell][]; field?: FieldStats };

let version = "0";
let dirty = false;
function persist() {
  dirty = true;
}

export async function hydrate(): Promise<void> {
  dirty = false;
  if (!persistenceEnabled) return;
  const { value: s, version: v } = await loadStore<Serialized>();
  version = v;
  store.riders = new Map(s?.riders ?? []);
  store.events = s?.events ?? [];
  store.sim = s?.sim ?? null;
  store.hazards = new Map(s?.hazards ?? []);
  store.field = s?.field ?? emptyField();
}

export async function flush(): Promise<void> {
  if (!dirty) return;
  prune();
  version = await saveStore(
    { riders: [...store.riders.entries()], events: store.events, sim: store.sim, hazards: [...store.hazards.entries()], field: store.field } satisfies Serialized,
    version,
  );
  dirty = false;
}

// Load, run, save. If another request saved in between, reload and run again.
export async function withStore<T>(fn: () => T | Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await hydrate();
    const out = await fn();
    try {
      await flush();
      return out;
    } catch (e) {
      if (e instanceof StoreConflict && attempt < 4) continue;
      throw e;
    }
  }
}

// Riders not seen for an hour with no events are dropped, and the rider
// table is capped, so a script rotating ids cannot grow the blob forever.
const RIDER_TTL_MS = 3_600_000;
const MAX_RIDERS = 500;
function prune() {
  const now = Date.now();
  const withEvents = new Set(store.events.map((e) => e.riderId));
  for (const [id, r] of store.riders) {
    if (id !== DEMO_RIDER && !withEvents.has(id) && now - r.lastSeenAt > RIDER_TTL_MS) store.riders.delete(id);
  }
  if (store.riders.size > MAX_RIDERS) {
    const oldest = [...store.riders.values()].filter((r) => r.riderId !== DEMO_RIDER).sort((a, b) => a.lastSeenAt - b.lastSeenAt);
    for (const r of oldest.slice(0, store.riders.size - MAX_RIDERS)) store.riders.delete(r.riderId);
  }
}

export const DEMO_RIDER = "rider-demo";
export const SAMPLE_RIDER = "rider-sample";

function newRider(riderId: string): RiderState {
  const p = pointAt(0);
  return {
    riderId,
    onShift: false,
    platform: "Platform A",
    jobId: null,
    jobs: [],
    keyHash: null,
    lat: p[1],
    lng: p[0],
    speedKmh: 0,
    rain: false,
    heat: "green",
    fatigue: 0,
    shiftStartedAt: null,
    deadlineAt: null,
    emergencyContact: null,
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
  r.jobs ??= [];
  return r;
}

// Read without creating, so polling an unknown id does not add a rider.
function peekRider(riderId: string): RiderState {
  return store.riders.get(riderId) ?? newRider(riderId);
}

// ---------- rider keys ----------
// The phone makes a random key once and sends it with every write. The first
// write claims the rider id (we keep only a hash), later writes must match.
// This is what stops one person cancelling another rider's crash.
function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function authorizeRider(riderId: string, key: string | null): boolean {
  if (!key || key.length < 16 || key.length > 128 || riderId === DEMO_RIDER || riderId === SAMPLE_RIDER) return false;
  const r = getRider(riderId);
  const h = hashKey(key);
  if (!r.keyHash) {
    r.keyHash = h;
    persist();
    return true;
  }
  return timingSafeEqual(Buffer.from(r.keyHash, "hex"), Buffer.from(h, "hex"));
}

export function keyMatches(riderId: string, key: string | null): boolean {
  const r = store.riders.get(riderId);
  if (!key || !r?.keyHash) return false;
  return timingSafeEqual(Buffer.from(r.keyHash, "hex"), Buffer.from(hashKey(key), "hex"));
}

// ---------- events ----------
export function listEvents(riderId?: string): EventRecord[] {
  tickDeadlines();
  const all = riderId ? store.events.filter((e) => e.riderId === riderId) : store.events;
  return [...all].sort((a, b) => b.ts - a.ts);
}

// Events past the cancel window with no tap are paid. The payment time is the
// deadline itself, so it never moves, and the outcome is signed.
function tickDeadlines() {
  const now = Date.now();
  for (const e of store.events) {
    if (e.status === "detected" && now > e.cancelDeadline) {
      e.status = "paid";
      e.insurance.paidAt = e.cancelDeadline;
      e.settlement = signSettlement(e, { status: "paid", paidAt: e.cancelDeadline, payoutHkd: e.insurance.payoutHkd, at: e.cancelDeadline });
      persist();
    }
  }
}

function newJob(platform: Platform): ActiveJob {
  return { platform, jobId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`, acceptedAt: Date.now() };
}

function syncPrimary(r: RiderState) {
  const last = r.jobs[r.jobs.length - 1];
  r.platform = last?.platform ?? r.platform;
  r.jobId = last?.jobId ?? null;
}

export function setShift(riderId: string, onShift: boolean, platform?: Platform) {
  const r = getRider(riderId);
  r.onShift = onShift;
  if (platform) r.platform = platform;
  r.shiftStartedAt = onShift ? r.shiftStartedAt ?? Date.now() : null;
  if (!onShift) r.jobs = [];
  else if (r.jobs.length === 0) r.jobs = [newJob(r.platform)];
  syncPrimary(r);
  r.lastSeenAt = Date.now();
  persist();
  return r;
}

// A second app's order open at the same time. This is the case the July 2026
// proposal has to apportion.
export function setSecondApp(riderId: string, on: boolean) {
  const r = getRider(riderId);
  if (!r.onShift) return r;
  const other: Platform = r.jobs[0]?.platform === "Platform B" ? "Platform A" : "Platform B";
  if (on && r.jobs.length < 2) r.jobs.push(newJob(other));
  if (!on) r.jobs = r.jobs.slice(0, 1);
  syncPrimary(r);
  persist();
  return r;
}

// Placeholder rule until the regime fixes one: equal shares across every app
// with an open order at impact.
export function apportion(jobs: ActiveJob[], fallback: Platform): { platform: Platform; share: number }[] {
  const platforms = [...new Set(jobs.map((j) => j.platform))];
  if (platforms.length === 0) return [{ platform: fallback, share: 1 }];
  return platforms.map((platform) => ({ platform, share: Number((1 / platforms.length).toFixed(4)) }));
}

export function setDeadline(riderId: string, minutesFromNow: number | null) {
  const r = getRider(riderId);
  r.deadlineAt = minutesFromNow === null ? null : Date.now() + minutesFromNow * 60_000;
  r.lastSeenAt = Date.now();
  persist();
  return r;
}

export function setEmergencyContact(riderId: string, phone: string | null) {
  const r = getRider(riderId);
  r.emergencyContact = phone ? phone.replace(/[^+\d]/g, "").slice(0, 20) : null;
  persist();
  return r;
}

function deadlineSecAt(r: RiderState, at: number): number | null {
  return r.deadlineAt ? Math.round((r.deadlineAt - at) / 1000) : null;
}

// Hazards: real jolts and hard brakes that were not crashes, on a 50 m grid,
// with no rider id and the time rounded to the hour. Only cells with at least
// HAZARD_MIN events are published, so a lone rider's path cannot be rebuilt.
export const HAZARD_MIN = 3;
function cellOf(r: RiderState): HazardCell {
  const lat = Math.round(r.lat * 2000) / 2000;
  const lng = Math.round(r.lng * 2000) / 2000;
  const key = `${lat},${lng}`;
  return store.hazards.get(key) ?? { cell: key, lat, lng, bumps: 0, brakes: 0, lastAt: 0, passes: 0 };
}

// A pass is counted once each time a rider enters a cell, with no rider id on
// the cell. Busy roads get more passes, so their jolts read as a rate.
function countPass(r: RiderState) {
  if (!r.onShift) return;
  const c = cellOf(r);
  if (r.lastCell === c.cell) return;
  r.lastCell = c.cell;
  c.passes = (c.passes ?? 0) + 1;
  store.hazards.set(c.cell, c);
  if (store.hazards.size > 5000) store.hazards.delete(store.hazards.keys().next().value!);
}

function recordHazard(r: RiderState, isCrash: boolean, kind: "bump" | "brake") {
  if (isCrash || !r.onShift) return;
  countPass(r);
  const c = cellOf(r);
  const key = c.cell;
  if (kind === "bump") c.bumps++;
  else c.brakes++;
  c.lastAt = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  store.hazards.set(key, c);
  if (store.hazards.size > 5000) store.hazards.delete(store.hazards.keys().next().value!);
}

// Rate per pass, shrunk toward the city mean with a prior worth HAZARD_PRIOR
// passes (Clayton and Kaldor 1987). A cell with two passes and two jolts does
// not outrank a main road with two hundred passes and forty jolts.
export const HAZARD_PRIOR = 20;
function publicHazards(): HazardCell[] {
  const cells = [...store.hazards.values()];
  const passes = cells.reduce((a, c) => a + Math.max(c.passes ?? 0, c.bumps + c.brakes), 0);
  const jolts = cells.reduce((a, c) => a + c.bumps + c.brakes, 0);
  const mean = passes > 0 ? jolts / passes : 0;
  return cells
    .filter((c) => c.bumps + c.brakes >= HAZARD_MIN)
    .map((c) => {
      const n = Math.max(c.passes ?? 0, c.bumps + c.brakes);
      return { ...c, passes: n, rate: Number(((c.bumps + c.brakes + HAZARD_PRIOR * mean) / (n + HAZARD_PRIOR)).toFixed(3)) };
    })
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
}

export function setContext(riderId: string, patch: Partial<Pick<RiderState, "rain" | "heat" | "platform">>) {
  const r = getRider(riderId);
  Object.assign(r, patch);
  if (patch.platform && r.jobs.length > 0) {
    r.jobs[0] = { ...r.jobs[0], platform: patch.platform };
    if (r.jobs[1]?.platform === patch.platform) r.jobs[1] = { ...r.jobs[1], platform: patch.platform === "Platform A" ? "Platform B" : "Platform A" };
    syncPrimary(r);
  }
  r.lastSeenAt = Date.now();
  persist();
  return r;
}

export type CancelResult = { event: EventRecord | null; cancelled: boolean };

export function cancelEvent(id: string): CancelResult {
  tickDeadlines();
  const e = store.events.find((x) => x.id === id);
  if (!e) return { event: null, cancelled: false };
  if (e.status === "detected" && Date.now() <= e.cancelDeadline) {
    const at = Date.now();
    e.status = "cancelled";
    e.settlement = signSettlement(e, { status: "cancelled", paidAt: null, payoutHkd: 0, at });
    persist();
    return { event: e, cancelled: true };
  }
  return { event: e, cancelled: e.status === "cancelled" };
}

// Tier two. The rider submits the hospital admission after a paid event; we
// sign it on receipt and the insurer confirms it with the hospital before the
// statutory amounts are paid.
export type HospitalInput = { hospital: string; admittedAt: number; dischargeRef: string };
export function submitHospital(id: string, h: HospitalInput): { event: EventRecord | null; error?: string } {
  tickDeadlines();
  const e = store.events.find((x) => x.id === id);
  if (!e) return { event: null, error: "not found" };
  if (e.status !== "paid") return { event: e, error: "tier two needs a paid tier one event" };
  if (e.hospital) return { event: e, error: "already submitted" };
  if (h.admittedAt < e.ts - 3_600_000 || h.admittedAt > Date.now() + 60_000) return { event: e, error: "admission time must be after the event" };
  e.hospital = signHospital(e, { hospital: h.hospital, admittedAt: h.admittedAt, dischargeRef: h.dischargeRef, submittedAt: Date.now() });
  persist();
  return { event: e };
}

// After a cancel (or a payout) the rider can say what it really was. Stored
// on the event as a weak label, counted only in aggregate.
export function setFeedback(id: string, label: Feedback): EventRecord | null {
  tickDeadlines();
  const e = store.events.find((x) => x.id === id);
  if (!e || e.status === "detected") return null;
  e.feedback = label;
  persist();
  return e;
}

// ---------- research mode ----------
export function setResearch(riderId: string, on: boolean) {
  const r = getRider(riderId);
  r.research = on;
  persist();
  return r;
}

// Deletion tag: derived from the rider's key hash, which never leaves the
// server, so a tag cannot be traced back to a rider id.
export function fieldTag(riderId: string): string | null {
  const h = store.riders.get(riderId)?.keyHash;
  return h ? createHash("sha256").update("field:" + h).digest("hex").slice(0, 16) : null;
}

export const RIDE_EVERY_MS = 4 * 60_000; // server-side floor; the phone sends one every 10 minutes
export type FieldKind = "ride" | "event";
export type FieldLabel = "riding" | "crash" | "false_alarm" | "real_fall" | "unsure";

// Prepare one donated window: check consent and the rate floor, bump the
// counters, and return the entry to push once the store has saved. The push
// happens outside the save loop so a retry can never store a window twice.
// Samples arrive in m/s^2 with ms timestamps and are kept in g with seconds
// from the start, rounded, with no position and no rider id.
export function prepareDonation(
  riderId: string,
  input: { kind: FieldKind; label: FieldLabel; source: SensorSource; samples: Sample[] },
): { ok: true; entry: Record<string, unknown> } | { ok: false; status: number; error: string } {
  const r = store.riders.get(riderId);
  if (!r?.research) return { ok: false, status: 403, error: "research mode is off for this rider" };
  if (input.kind === "ride" && r.lastRideDonationAt && Date.now() - r.lastRideDonationAt < RIDE_EVERY_MS) {
    return { ok: false, status: 429, error: "one ride segment every few minutes" };
  }
  const t0 = input.samples[0].t;
  const durationS = (input.samples[input.samples.length - 1].t - t0) / 1000;
  const entry = {
    id: "FLD-" + randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase(),
    tag: fieldTag(riderId)!,
    kind: input.kind,
    label: input.label,
    source: input.source,
    day: new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10), // HKT date only, no time
    durationS: Number(durationS.toFixed(2)),
    samples: input.samples.map((x) => [Number(((x.t - t0) / 1000).toFixed(3)), Number((x.ax / 9.81).toFixed(3)), Number((x.ay / 9.81).toFixed(3)), Number((x.az / 9.81).toFixed(3))]),
  };
  if (input.kind === "ride") {
    r.lastRideDonationAt = Date.now();
    store.field.rides++;
    store.field.rideSeconds = Number((store.field.rideSeconds + durationS).toFixed(1));
  } else store.field.events++;
  store.field.labels[input.label] = (store.field.labels[input.label] ?? 0) + 1;
  persist();
  return { ok: true, entry };
}

export { pushField };

export async function withdrawResearch(riderId: string): Promise<number> {
  const tag = fieldTag(riderId);
  setResearch(riderId, false);
  return tag ? deleteField(tag) : 0;
}

export function eventOwner(id: string): string | null {
  return store.events.find((x) => x.id === id)?.riderId ?? null;
}

// ---------- detection ----------
function peakAt(samples: Sample[]): { t: number; g: number } {
  let best = { t: 0, g: 0 };
  for (const s of samples) {
    const gg = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az) / 9.81;
    if (gg > best.g) best = { t: s.t, g: gg };
  }
  return best;
}

// Two-sensor agreement, borrowed from earthquake early warning: a helmet
// crash counts only if the phone also felt a jolt of at least 2 g within one
// second. A bag drop moves the phone, not the head; a helmet knocked off a
// seat leaves the phone still.
export const AGREE_WINDOW_MS = 1000;
export const AGREE_PHONE_G = 2;
export function agree(helmet: Sample[], phone: Sample[]): boolean {
  const h = peakAt(helmet);
  const p = peakAt(phone);
  return p.g >= AGREE_PHONE_G && Math.abs(h.t - p.t) <= AGREE_WINDOW_MS;
}

export function ingest(
  riderId: string,
  samples: Sample[],
  pos?: { lat: number; lng: number; speedKmh?: number },
  opts: { source?: SensorSource; phoneSamples?: Sample[] } = {},
) {
  const r = getRider(riderId);
  const d: Detection = detectCrash(samples);
  // Off shift nothing is read: no position, no window, no event.
  if (!r.onShift) return { rider: r, detection: d, event: null as EventRecord | null, sources: [] as SensorSource[] };
  r.lastSeenAt = Date.now();
  if (pos) {
    r.lat = pos.lat;
    r.lng = pos.lng;
    if (pos.speedKmh !== undefined) r.speedKmh = pos.speedKmh;
    countPass(r);
  }
  const source = opts.source ?? "phone";
  let sources: SensorSource[] = [source];
  let isCrash = d.isCrash;
  if (source === "helmet" && opts.phoneSamples?.length) {
    const both = agree(samples, opts.phoneSamples);
    sources = both ? ["helmet", "phone"] : ["helmet"];
    isCrash = d.isCrash && both;
  }
  const hours = r.shiftStartedAt ? (Date.now() - r.shiftStartedAt) / 3.6e6 : 0;
  r.fatigue = fatigueScore(hours, 0);
  r.lastWindow = d.stats;
  r.lastDetection = { p: d.confidence, isCrash, ruleFlag: d.ruleFlag, scenario: null, at: Date.now() };
  let event: EventRecord | null = null;
  const recent = store.events.find((e) => e.riderId === riderId && Date.now() - e.ts < 60_000);
  if (isCrash && !recent) {
    event = createEvent(r, d.confidence, sources);
  } else if (d.stats.peakG >= 2.5) {
    recordHazard(r, isCrash, "bump");
  }
  persist();
  return { rider: r, detection: d, event, sources };
}

// Push one of the synthetic demo windows through the real detector for the
// demo rider. The windows come from a synthetic draw the model never trained on.
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
    event = createEvent(r, d.confidence, ["phone"]); // mode is read from speed, so create before stopping the rider
    r.speedKmh = 0;
  } else if (scenario === "pothole" || scenario === "set_down" || scenario === "bag_drop") {
    recordHazard(r, d.isCrash, "bump");
  } else if (scenario === "braking") {
    recordHazard(r, d.isCrash, "brake");
  }
  persist();
  return { rider: r, detection: d, event };
}

function newEventId(): string {
  return `EVT-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function createEvent(r: RiderState, confidence: number, sources: SensorSource[], at = Date.now()): EventRecord {
  const stats = r.lastWindow ?? { peakG: 0, tiltDeg: 0, stillSec: 0, sampleCount: 0 };
  const prev = store.events.filter((e) => e.riderId === r.riderId).sort((a, b) => b.ts - a.ts)[0];
  const activeJobs = r.jobs.map((j) => ({ ...j }));
  const facts = {
    id: newEventId(),
    riderId: r.riderId,
    platform: r.platform,
    jobId: r.jobId,
    activeJobs,
    apportionment: apportion(activeJobs, r.platform),
    sources,
    prevHash: prev ? recordHash(prev) : null,
    ts: at,
    deadlineSec: deadlineSecAt(r, at),
    mode: (r.speedKmh > 25 ? "motorcycle" : r.speedKmh > 8 ? "bicycle" : r.speedKmh > 0 ? "walking" : "unknown") as EventRecord["mode"],
    lat: r.lat,
    lng: r.lng,
    peakG: Number(stats.peakG.toFixed(1)),
    tiltDeg: Math.round(stats.tiltDeg),
    stillSec: Number(stats.stillSec.toFixed(1)),
    confidence,
    context: { rain: r.rain, heat: r.heat, fatigue: r.fatigue },
  };
  const e: EventRecord = {
    ...facts,
    status: "detected",
    cancelDeadline: at + THRESHOLDS.cancelWindowSec * 1000,
    triage: triageProfile(stats.peakG, r.speedKmh),
    insurance: {
      premiumWindowHkd: premiumWindowHkd(r.rain, r.heat, r.fatigue),
      payoutHkd: FIXED_PAYOUT_HKD,
      paidAt: null,
    },
    signature: signRecord(facts),
    settlement: null,
  };
  store.events.unshift(e);
  if (store.events.length > 200) store.events.length = 200;
  persist();
  return e;
}

// A signed example event from a rider on two apps, so the dispatcher,
// underwriter and labour screens are not blank on a cold open. Marked sample
// everywhere it shows.
function seedSample() {
  if (store.events.some((e) => e.riderId === SAMPLE_RIDER)) return;
  const at = Date.now() - 2 * 3_600_000;
  const r = newRider(SAMPLE_RIDER);
  Object.assign(r, {
    onShift: true,
    jobs: [
      { platform: "Platform A", jobId: "ORD-2417", acceptedAt: at - 9 * 60_000 },
      { platform: "Platform B", jobId: "ORD-5083", acceptedAt: at - 4 * 60_000 },
    ],
    lat: 22.3218,
    lng: 114.1762,
    speedKmh: 31,
    rain: true,
    heat: "amber",
    fatigue: 0.42,
    deadlineAt: at - 95_000,
    lastWindow: { peakG: 15.2, tiltDeg: 88, stillSec: 4.1, sampleCount: 300 },
  } satisfies Partial<RiderState>);
  syncPrimary(r);
  const e = createEvent(r, 0.97, ["helmet", "phone"], at);
  e.sample = true;
  e.status = "paid";
  e.insurance.paidAt = e.cancelDeadline;
  e.settlement = signSettlement(e, { status: "paid", paidAt: e.cancelDeadline, payoutHkd: e.insurance.payoutHkd, at: e.cancelDeadline });
}

// ---------- scripted demo ----------
export function simStart() {
  const r = getRider(DEMO_RIDER);
  setShift(DEMO_RIDER, true, r.platform);
  setDeadline(DEMO_RIDER, 12);
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

// Demo shortcuts for the scripted rider's latest event.
export function simHospital() {
  const e = listEvents(DEMO_RIDER).find((x) => x.status === "paid");
  if (e) submitHospital(e.id, { hospital: "Kwong Wah Hospital", admittedAt: Date.now(), dischargeRef: "DEMO-" + e.id.slice(4, 10) });
  return snapshot(DEMO_RIDER);
}

export function simFeedback(label: Feedback) {
  const e = listEvents(DEMO_RIDER).find((x) => x.status !== "detected");
  if (e) setFeedback(e.id, label);
  return snapshot(DEMO_RIDER);
}

export function simReset() {
  store.sim = null;
  store.riders.delete(DEMO_RIDER);
  store.events = store.events.filter((e) => e.riderId !== DEMO_RIDER);
  store.hazards.clear();
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

// ---------- what leaves the server ----------
// Never the key hash. The emergency contact only to the rider who owns it.
export function publicRider(r: RiderState, own: boolean): RiderState {
  const { keyHash: _k, ...rest } = r;
  void _k;
  return { ...rest, emergencyContact: own ? r.emergencyContact : null };
}

// Other riders on the shared map: a short id and a position rounded to about
// 100 m. No contact, no window, no speed.
function otherRider(r: RiderState): RiderState {
  return {
    ...newRider(r.riderId.slice(0, 10)),
    onShift: r.onShift,
    lat: Number(r.lat.toFixed(3)),
    lng: Number(r.lng.toFixed(3)),
    lastSeenAt: r.lastSeenAt,
    keyHash: undefined,
  };
}

// Events of the demo and sample riders are shown in full. Real riders' events
// on the shared screens get a short id and a location rounded to about 100 m.
function publicEvent(e: EventRecord, viewer: string | null): EventRecord {
  if (e.riderId === viewer || e.riderId === DEMO_RIDER || e.riderId === SAMPLE_RIDER) return e;
  return { ...e, riderId: e.riderId.slice(0, 10), lat: Number(e.lat.toFixed(3)), lng: Number(e.lng.toFixed(3)) };
}

export function snapshot(riderId: string, own = false) {
  seedSample();
  advanceSim();
  tickDeadlines();
  const rider = peekRider(riderId);
  const events = listEvents(riderId);
  const now = Date.now();
  const others = [...store.riders.values()]
    .filter((r) => r.riderId !== riderId && r.riderId !== SAMPLE_RIDER && r.onShift && now - r.lastSeenAt < 120_000)
    .map(otherRider);
  return {
    rider: publicRider(rider, own),
    events,
    others,
    allEvents: listEvents().map((e) => publicEvent(e, riderId)),
    hazards: publicHazards(),
    deadlineSec: deadlineSecAt(rider, now),
    premiumWindowHkd: premiumWindowHkd(rider.rain, rider.heat, rider.fatigue),
    route: ROUTE,
    scenarios: REPLAY_SCENARIOS,
    serverTime: now,
  };
}

export function allSnapshot() {
  seedSample();
  advanceSim();
  tickDeadlines();
  return {
    riders: [...store.riders.values()].filter((r) => r.riderId !== SAMPLE_RIDER).map(otherRider),
    events: listEvents().map((e) => publicEvent(e, null)),
    serverTime: Date.now(),
  };
}

// ---------- Labour Department view ----------
// Aggregates only. No rider id, no exact place or time. Cancelled events are
// false alarms and are left out.
export function labourAggregate() {
  seedSample();
  tickDeadlines();
  const events = store.events.filter((e) => e.status !== "cancelled");
  const count = <K extends string>(keys: K[], pick: (e: EventRecord) => K) =>
    Object.fromEntries(keys.map((k) => [k, events.filter((e) => pick(e) === k).length])) as Record<K, number>;
  const clock = (e: EventRecord) =>
    e.deadlineSec === null ? "no countdown" : e.deadlineSec < 0 ? "already late" : e.deadlineSec < 300 ? "under 5 min left" : e.deadlineSec < 900 ? "5 to 15 min left" : "over 15 min left";
  const hourHK = (e: EventRecord) => (new Date(e.ts).getUTCHours() + 8) % 24;
  const band = (h: number) => (h < 6 ? "00-06" : h < 11 ? "06-11" : h < 14 ? "11-14" : h < 17 ? "14-17" : h < 21 ? "17-21" : "21-24");
  return {
    total: events.length,
    samples: events.filter((e) => e.sample).length,
    multiApp: events.filter((e) => (e.activeJobs?.length ?? 1) > 1).length,
    tierTwo: events.filter((e) => e.hospital).length,
    // weak labels from riders, over every event including cancelled ones
    labels: (["false_alarm", "real_fall", "unsure"] as Feedback[]).reduce(
      (acc, k) => ({ ...acc, [k]: store.events.filter((e) => e.feedback === k).length }),
      {} as Record<Feedback, number>,
    ),
    byMode: count(["motorcycle", "bicycle", "walking", "unknown"], (e) => e.mode),
    byClock: count(["already late", "under 5 min left", "5 to 15 min left", "over 15 min left", "no countdown"], clock),
    byHeat: count(["green", "amber", "red"], (e) => e.context.heat),
    byRain: count(["rain", "dry"], (e) => (e.context.rain ? "rain" : "dry")),
    byHour: count(["00-06", "06-11", "11-14", "14-17", "17-21", "21-24"], (e) => band(hourHK(e))),
    hazards: publicHazards().map(({ lat, lng, bumps, brakes, passes, rate }) => ({ lat, lng, bumps, brakes, passes, rate })),
    field: { ...store.field, rideHours: Number((store.field.rideSeconds / 3600).toFixed(2)) },
    hazardMin: HAZARD_MIN,
    hazardPrior: HAZARD_PRIOR,
    generatedAt: Date.now(),
  };
}
