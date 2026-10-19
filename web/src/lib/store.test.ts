import assert from "node:assert/strict";
import test from "node:test";
import { cancelEvent, DEMO_RIDER, getRider, ingest, listEvents, replay, REPLAY_SCENARIOS, setContext, setShift, simReset, simStart, snapshot } from "./store";
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
  const c = cancelEvent(e.id)!;
  assert.equal(c.status, "cancelled");
  assert.equal(snapshot(DEMO_RIDER).events[0].status, "cancelled");
});

test("silence past the deadline marks the event paid", () => {
  simReset();
  simStart();
  const e = replay("crash")!.event!;
  e.cancelDeadline = Date.now() - 1; // time travel instead of waiting 30 s
  const after = listEvents(DEMO_RIDER)[0];
  assert.equal(after.status, "paid");
  assert.ok(after.insurance.paidAt);
  assert.equal(cancelEvent(e.id)!.status, "paid", "too late to cancel");
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

test("jolts that are not crashes become de-identified hazard cells", () => {
  simReset();
  simStart();
  replay("pothole");
  replay("braking");
  const snap = snapshot(DEMO_RIDER);
  assert.ok(snap.hazards.length >= 1);
  const cell = snap.hazards[0];
  assert.ok(cell.bumps + cell.brakes >= 2);
  assert.equal("riderId" in cell, false, "no rider id on a hazard cell");
});
