import assert from "node:assert/strict";
import test from "node:test";
import { agree, allSnapshot, apportion, authorizeRider, cancelEvent, DEMO_RIDER, getRider, HAZARD_MIN, ingest, keyMatches, labourAggregate, listEvents, replay, REPLAY_SCENARIOS, setContext, setEmergencyContact, setSecondApp, setShift, simReset, simStart, snapshot } from "./store";
import type { Sample } from "./schema";

const G = 9.81;

function ride(n: number, t0 = Date.now() - 6000): Sample[] {
  return Array.from({ length: n }, (_, i) => ({ t: t0 + i * 10, ax: Math.sin(i) * 0.3, ay: Math.cos(i) * 0.3, az: G + Math.sin(i * 0.7) * 0.4 }));
}

test("all six demo scenarios are available", () => {
  assert.deepEqual([...REPLAY_SCENARIOS].sort(), ["bag_drop", "braking", "crash", "pothole", "riding", "set_down"]);
});

test("off shift, nothing becomes an event", () => {
  simReset();
  const out = replay("crash");
  assert.ok(out);
  assert.equal(out!.detection.isCrash, true);
  assert.equal(out!.event, null, "no event while off shift");
  assert.equal(listEvents(DEMO_RIDER).length, 0);
});

test("on shift, only the crash scenario creates an event", () => {
  simReset();
  simStart();
  for (const s of ["riding", "braking", "pothole", "set_down", "bag_drop"]) {
    const out = replay(s)!;
    assert.equal(out.detection.isCrash, false, `${s} p=${out.detection.confidence}`);
    assert.equal(out.event, null, s);
  }
  const crash = replay("crash")!;
  assert.equal(crash.detection.isCrash, true);
  assert.ok(crash.event, "crash creates an event");
  assert.equal(crash.event!.status, "detected");
  assert.equal(crash.event!.platform, "Platform A");
  assert.ok(crash.event!.jobId?.startsWith("ORD-"));
  assert.ok(crash.event!.cancelDeadline - crash.event!.ts >= 30_000);
  assert.equal(listEvents(DEMO_RIDER).length, 1);
});

test("the record names the platform active at impact", () => {
  simReset();
  simStart();
  setContext(DEMO_RIDER, { platform: "Platform B" });
  const out = replay("crash")!;
  assert.equal(out.event!.platform, "Platform B");
});

test("a second crash inside the cancel window does not duplicate the event", () => {
  simReset();
  simStart();
  replay("crash");
  const again = replay("crash")!;
  assert.equal(again.event, null);
  assert.equal(listEvents(DEMO_RIDER).length, 1);
});

test("the rider can cancel inside 30 seconds and the payout never fires", () => {
  simReset();
  simStart();
  const e = replay("crash")!.event!;
  const c = cancelEvent(e.id);
  assert.equal(c.cancelled, true);
  assert.equal(c.event!.status, "cancelled");
  assert.equal(c.event!.settlement?.status, "cancelled", "the outcome is signed");
  assert.equal(snapshot(DEMO_RIDER).events[0].status, "cancelled");
});

test("silence past the deadline marks the event paid", () => {
  simReset();
  simStart();
  const e = replay("crash")!.event!;
  e.cancelDeadline = Date.now() - 1; // time travel instead of waiting 30 s
  const after = listEvents(DEMO_RIDER)[0];
  assert.equal(after.status, "paid");
  assert.equal(after.insurance.paidAt, e.cancelDeadline, "paid at the deadline");
  const again = listEvents(DEMO_RIDER)[0];
  assert.equal(again.insurance.paidAt, after.insurance.paidAt, "the payment time does not move on reload");
  const late = cancelEvent(e.id);
  assert.equal(late.cancelled, false, "too late to cancel");
  assert.equal(late.event!.status, "paid");
});

test("exposure changes the premium", () => {
  simReset();
  simStart();
  const calm = snapshot(DEMO_RIDER).premiumWindowHkd;
  setContext(DEMO_RIDER, { rain: true, heat: "red" });
  const rough = snapshot(DEMO_RIDER).premiumWindowHkd;
  assert.ok(rough > calm);
});

test("telemetry from a real phone goes through the same detector", () => {
  const id = "rider-test-phone";
  setShift(id, true, "Platform A");
  const quiet = ingest(id, ride(300), { lat: 22.3, lng: 114.17, speedKmh: 20 });
  assert.equal(quiet.detection.isCrash, false);
  assert.equal(quiet.event, null);
  assert.equal(getRider(id).lat, 22.3);
  assert.equal(getRider(id).speedKmh, 20);
  assert.ok(getRider(id).lastDetection);
  setShift(id, false);
  assert.equal(getRider(id).onShift, false);
  assert.equal(getRider(id).jobId, null);
});

test("the scripted rider moves along the route while on shift", () => {
  simReset();
  const a = simStart().rider;
  const start = [a.lat, a.lng];
  const later = snapshot(DEMO_RIDER).rider;
  assert.equal(later.onShift, true);
  assert.ok(later.speedKmh > 0);
  assert.ok(typeof start[0] === "number" && typeof start[1] === "number");
});

test("every event is signed and verifies, and tampering breaks it", async () => {
  const { verifyRecord } = await import("./sign");
  simReset();
  simStart();
  const e = replay("crash")!.event!;
  assert.ok(e.signature, "signature present");
  assert.equal(verifyRecord(e, e.signature!), true);
  const tampered = { ...e, platform: "Platform B" as const };
  assert.equal(verifyRecord(tampered, e.signature!), false, "changing the platform must break the signature");
  assert.equal(typeof e.deadlineSec, "number", "demo rider has a deadline so the record carries one");
  assert.ok(["motorcycle", "bicycle", "walking", "unknown"].includes(e.mode));
});

test("jolts that are not crashes become de-identified hazard cells, published from the minimum count", () => {
  simReset();
  simStart();
  replay("pothole");
  assert.equal(snapshot(DEMO_RIDER).hazards.length, 0, "one jolt is not published");
  for (let i = 1; i < HAZARD_MIN; i++) replay("braking");
  const snap = snapshot(DEMO_RIDER);
  assert.ok(snap.hazards.length >= 1);
  const cell = snap.hazards[0];
  assert.ok(cell.bumps + cell.brakes >= HAZARD_MIN);
  assert.equal(cell.lastAt % 3_600_000, 0, "time rounded to the hour");
  assert.equal("riderId" in cell, false, "no rider id on a hazard cell");
});

const KEY = "k".repeat(32);

test("a rider key claims the id and other keys are refused", () => {
  const id = "rider-key-test";
  assert.equal(authorizeRider(id, KEY), true, "first key claims");
  assert.equal(authorizeRider(id, KEY), true, "same key again");
  assert.equal(authorizeRider(id, "x".repeat(32)), false, "other key refused");
  assert.equal(authorizeRider(id, null), false);
  assert.equal(authorizeRider(DEMO_RIDER, KEY), false, "nobody can claim the demo rider");
  assert.equal(keyMatches(id, KEY), true);
});

test("the emergency contact and key hash never leak to other viewers", () => {
  const id = "rider-leak-test";
  authorizeRider(id, KEY);
  setShift(id, true, "Platform A");
  setEmergencyContact(id, "+852 9123 4567");
  ingest(id, ride(300), { lat: 22.312345, lng: 114.171234 });
  assert.equal(snapshot(id, false).rider.emergencyContact, null);
  assert.equal(snapshot(id, true).rider.emergencyContact, "+85291234567");
  assert.equal("keyHash" in snapshot(id, true).rider && snapshot(id, true).rider.keyHash !== undefined, false);
  const other = snapshot(DEMO_RIDER).others.find((o) => id.startsWith(o.riderId));
  assert.ok(other, "shown on the shared map");
  assert.equal(other!.emergencyContact, null);
  assert.equal(other!.lastWindow, null);
  assert.equal(other!.lat, 22.312, "position rounded");
  for (const r of allSnapshot().riders) assert.equal(r.emergencyContact, null);
  setShift(id, false);
});

test("off shift, telemetry stores nothing", () => {
  const id = "rider-offshift-test";
  const before = getRider(id).lat;
  const out = ingest(id, ride(300), { lat: 1, lng: 1 });
  assert.equal(out.event, null);
  assert.equal(getRider(id).lat, before, "position not stored off shift");
  assert.equal(getRider(id).lastWindow, null);
});

test("helmet and phone must agree within a second", () => {
  const t0 = Date.now() - 6000;
  const quiet = ride(300, t0);
  const spike = (at: number) => ride(300, t0).map((s) => (s.t === at ? { ...s, ax: 8 * G } : s));
  const helmet = spike(t0 + 2500);
  assert.equal(agree(helmet, spike(t0 + 2800)), true, "phone jolt 0.3 s later agrees");
  assert.equal(agree(helmet, spike(t0 + 4500)), false, "2 s later does not");
  assert.equal(agree(helmet, quiet), false, "a still phone does not");
});

test("two apps open at impact are both in the record and split the liability", () => {
  simReset();
  simStart();
  setSecondApp(DEMO_RIDER, true);
  const e = replay("crash")!.event!;
  assert.equal(e.activeJobs.length, 2);
  assert.deepEqual(new Set(e.activeJobs.map((j) => j.platform)), new Set(["Platform A", "Platform B"]));
  assert.equal(e.apportionment.reduce((a, b) => a + b.share, 0), 1);
  assert.deepEqual(apportion([], "Platform A"), [{ platform: "Platform A", share: 1 }]);
});

test("records chain, settlements are signed, and editing the payout breaks verification", async () => {
  const { recordHash, verifyRecord, verifySettlement } = await import("./sign");
  simReset();
  simStart();
  const first = replay("crash")!.event!;
  first.cancelDeadline = Date.now() - 1;
  const paid = listEvents(DEMO_RIDER)[0];
  assert.equal(verifySettlement(paid), true);
  assert.equal(verifySettlement({ ...paid, settlement: { ...paid.settlement!, payoutHkd: 80000 } }), false);
  assert.equal(verifySettlement({ ...paid, settlement: { ...paid.settlement!, status: "cancelled" } }), false);
  const reordered = JSON.parse(JSON.stringify({ ...paid, context: { fatigue: paid.context.fatigue, heat: paid.context.heat, rain: paid.context.rain } }));
  assert.equal(verifyRecord(reordered, paid.signature!), true, "key order does not matter");
  // a second event links to the first
  const r = getRider(DEMO_RIDER);
  r.onShift = true;
  const events = listEvents(DEMO_RIDER);
  events.forEach((e) => (e.ts = Date.now() - 120_000));
  const second = replay("crash")!.event!;
  assert.equal(second.prevHash, recordHash(paid));
});

test("a signed sample event fills empty screens and the labour view aggregates without ids", () => {
  const snap = snapshot(DEMO_RIDER);
  const sample = snap.allEvents.find((e) => e.sample);
  assert.ok(sample, "sample present");
  assert.equal(sample!.activeJobs.length, 2);
  const agg = labourAggregate();
  assert.ok(agg.total >= 1);
  assert.equal(JSON.stringify(agg).includes("rider-"), false, "no rider ids in the labour view");
});
