import { NextResponse } from "next/server";

// The event record as JSON Schema. This is the standard: anyone can validate
// a record against it without talking to us.
const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://metricsfile.vercel.app/api/schema",
  title: "Metrics work-injury event record",
  description:
    "One verified work-time impact for a platform worker. Everything upstream of this record stays on the worker's device. Version 1.",
  type: "object",
  required: ["id", "riderId", "platform", "ts", "lat", "lng", "peakG", "tiltDeg", "stillSec", "confidence", "status", "cancelDeadline", "triage", "insurance", "context"],
  additionalProperties: false,
  properties: {
    id: { type: "string", pattern: "^EVT-[A-Z0-9]+$", description: "Unique, time-ordered event id" },
    riderId: { type: "string", maxLength: 64, description: "Pseudonymous worker id held on the device" },
    platform: { type: "string", description: "The platform the worker was on at the moment of impact. Basis for apportionment" },
    jobId: { type: ["string", "null"], description: "The platform's order or trip id active at impact" },
    ts: { type: "integer", description: "Impact time, milliseconds since epoch, device clock, confirmed on receipt" },
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
  },
  "x-governance": {
    owner: "The worker owns the record and all raw data.",
    readers: { platform: "events it is liable for", insurer: "events it covers", court: "on request", labourDepartment: "aggregate only" },
    neverIncluded: ["route", "speed history", "raw sensor trace", "per-worker risk score"],
  },
};

export async function GET() {
  return NextResponse.json(schema, { headers: { "cache-control": "public, max-age=3600" } });
}
