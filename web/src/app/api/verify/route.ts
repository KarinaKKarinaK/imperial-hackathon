import { NextResponse } from "next/server";
import { publicKeyPem, verifyRecord } from "@/lib/sign";
import type { EventRecord } from "@/lib/schema";

// Anyone can check a record: POST the record JSON (with its signature) and
// get back whether the impact facts are unchanged since the server signed them.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as (Partial<EventRecord> & { signature?: string }) | null;
  if (!body || typeof body.signature !== "string" || typeof body.id !== "string") {
    return NextResponse.json({ error: "record with signature required" }, { status: 400 });
  }
  const valid = verifyRecord(body as EventRecord, body.signature);
  return NextResponse.json({ id: body.id, valid, publicKey: publicKeyPem() });
}

export async function GET() {
  return NextResponse.json({ publicKey: publicKeyPem(), algorithm: "Ed25519", signed: "id, riderId, platform, jobId, ts, deadlineSec, mode, lat, lng, peakG, tiltDeg, stillSec, confidence, context" });
}
