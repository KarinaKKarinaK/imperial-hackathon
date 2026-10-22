import { NextResponse } from "next/server";
import { publicKeyPem } from "@/lib/sign";

// The event record as JSON Schema. This is the standard: anyone can validate
// a record against it without talking to us.
const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://metricsfile.vercel.app/api/schema",
  title: "Metrics work-injury event record",
  description:
    "One verified work-time impact for a platform worker. Everything upstream of this record stays on the worker's device. Version 2.",
  type: "object",
  required: ["id", "riderId", "platform", "activeJobs", "apportionment", "sources", "prevHash", "ts", "deadlineSec", "mode", "lat", "lng", "peakG", "tiltDeg", "stillSec", "confidence", "status", "cancelDeadline", "triage", "insurance", "context", "signature", "settlement"],
  additionalProperties: false,
  properties: {
    id: { type: "string", pattern: "^EVT-[A-Z0-9]+$", description: "Unique random event id" },
    riderId: { type: "string", maxLength: 64, description: "Pseudonymous worker id held on the device" },
    platform: { type: "string", description: "The platform the worker was on at the moment of impact. Basis for apportionment" },
    jobId: { type: ["string", "null"], description: "The platform's order or trip id active at impact" },
    activeJobs: {
      type: "array",
      description: "Every app with an open order at impact. One third of Hong Kong riders run more than one app",
      items: { type: "object", required: ["platform", "jobId", "acceptedAt"], properties: { platform: { type: "string" }, jobId: { type: "string" }, acceptedAt: { type: "integer" } } },
    },
    apportionment: {
      type: "array",
      description: "Liability split across platforms, shares sum to 1. Placeholder rule: equal shares until the regime fixes one",
      items: { type: "object", required: ["platform", "share"], properties: { platform: { type: "string" }, share: { type: "number", minimum: 0, maximum: 1 } } },
    },
    sources: { type: "array", items: { type: "string", enum: ["phone", "helmet"] }, description: "Sensors that agreed on the impact. helmet plus phone means both felt it within one second" },
    prevHash: { type: ["string", "null"], description: "sha256 of this worker's previous record and its signature. A deleted or edited record breaks the chain" },
    ts: { type: "integer", description: "Impact time, milliseconds since epoch, device clock, confirmed on receipt" },
    deadlineSec: { type: ["integer", "null"], description: "Seconds left on the delivery countdown at impact, negative if already late. The field that links time pressure to injury" },
    mode: { type: "string", enum: ["motorcycle", "bicycle", "walking", "unknown"], description: "Travel mode inferred from speed at impact. Phone-only riders are covered on every mode" },
    lat: { type: "number", minimum: -90, maximum: 90 },
    lng: { type: "number", minimum: -180, maximum: 180 },
    peakG: { type: "number", minimum: 0, description: "Peak resultant acceleration in g over the 6 s window" },
    tiltDeg: { type: "number", minimum: 0, maximum: 180, description: "Change in gravity direction across the impact" },
    stillSec: { type: "number", minimum: 0, description: "Longest near-zero-motion run after impact" },
    confidence: { type: "number", minimum: 0, maximum: 1, description: "Crash probability from the deployed model" },
    status: { type: "string", enum: ["detected", "cancelled", "confirmed", "paid"] },
    cancelDeadline: { type: "integer", description: "ts plus the cancel window in ms. One tap before this voids the event" },
    triage: {
      type: "object",
      required: ["profile", "mechanism"],
      properties: {
        profile: { type: "string", description: "Probable trauma profile for dispatch. Never a diagnosis" },
        mechanism: { type: "string" },
      },
    },
    insurance: {
      type: "object",
      required: ["premiumWindowHkd", "payoutHkd", "paidAt"],
      properties: {
        premiumWindowHkd: { type: "number", minimum: 0 },
        payoutHkd: { type: "number", minimum: 0 },
        paidAt: { type: ["integer", "null"] },
      },
    },
    context: {
      type: "object",
      required: ["rain", "heat", "fatigue"],
      properties: {
        rain: { type: "boolean" },
        heat: { type: "string", enum: ["green", "amber", "red"] },
        fatigue: { type: "number", minimum: 0, maximum: 1, description: "Worker-facing heuristic. Never shared per worker" },
      },
    },
    signature: { type: ["string", "null"], description: "Ed25519 signature over the impact facts, base64url. Check at /api/verify" },
    settlement: {
      type: ["object", "null"],
      description: "Signed once the outcome is final, so status and payout cannot be edited either",
      properties: { status: { enum: ["cancelled", "paid"] }, paidAt: { type: ["integer", "null"] }, payoutHkd: { type: "number" }, at: { type: "integer" }, signature: { type: "string" } },
    },
    hospital: {
      type: ["object", "null"],
      description: "Tier two. Hospital admission submitted by the worker after a paid event, signed on receipt, confirmed by the insurer with the hospital",
      properties: { hospital: { type: "string" }, admittedAt: { type: "integer" }, dischargeRef: { type: "string" }, submittedAt: { type: "integer" }, status: { enum: ["submitted", "confirmed"] }, signature: { type: "string" } },
    },
    feedback: { type: ["string", "null"], enum: ["false_alarm", "real_fall", "unsure", null], description: "What the worker says it was, after a cancel or payout. A weak label for retraining, counted only in aggregate" },
    sample: { type: "boolean", description: "Seeded example, never a real worker" },
  },
  "x-signing": { algorithm: "Ed25519", publicKeyPem: "{PUBKEY}", verify: "POST /api/verify with the record" },
  "x-governance": {
    owner: "The worker owns the record and all raw data.",
    readers: { platform: "events it is liable for", insurer: "events it covers", court: "on request", labourDepartment: "aggregate only" },
    neverIncluded: ["route", "speed history", "raw sensor trace", "per-worker risk score"],
  },
};

export async function GET() {
  const out = JSON.parse(JSON.stringify(schema).replace("{PUBKEY}", publicKeyPem().replace(/\n/g, "\\n")));
  return NextResponse.json(out, { headers: { "cache-control": "public, max-age=600" } });
}
