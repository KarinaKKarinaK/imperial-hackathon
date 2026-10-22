import { NextResponse } from "next/server";
import { publicKeyPem, recordHash, SIGNED_FIELDS, verifyHospital, verifyRecord, verifySettlement } from "@/lib/sign";
import type { EventRecord } from "@/lib/schema";

// Anyone can check a record: POST the record JSON and get back whether the
// impact facts and, once final, the outcome are unchanged since we signed
// them. Post the rider's previous record as `previous` to check the chain.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as (Partial<EventRecord> & { previous?: EventRecord }) | null;
  if (!body || typeof body.signature !== "string" || typeof body.id !== "string") {
    return NextResponse.json({ error: "record with signature required" }, { status: 400 });
  }
  const valid = verifyRecord(body, body.signature);
  const settlementValid = body.settlement ? verifySettlement(body as EventRecord) : null;
  const hospitalValid = body.hospital ? verifyHospital(body as EventRecord) : null;
  const chainValid = body.previous && typeof body.prevHash === "string" ? recordHash(body.previous) === body.prevHash : null;
  return NextResponse.json({ id: body.id, valid, settlementValid, hospitalValid, chainValid, publicKey: publicKeyPem() });
}

export async function GET() {
  return NextResponse.json({
    publicKey: publicKeyPem(),
    algorithm: "Ed25519",
    signed: SIGNED_FIELDS.join(", "),
    settlement: "id, status, paidAt, payoutHkd, at, facts signature",
    hospital: "id, hospital, admittedAt, dischargeRef, submittedAt, facts signature",
    chain: "prevHash = sha256(canonical facts of the previous record + its signature)",
  });
}
