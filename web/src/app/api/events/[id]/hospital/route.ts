import { NextResponse } from "next/server";
import { eventOwner, keyMatches, submitHospital } from "@/lib/store";
import { forbidden, riderKey, storeRoute } from "@/lib/api";

// Tier two: the rider submits the hospital admission for a paid event.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as { hospital?: unknown; admittedAt?: unknown; dischargeRef?: unknown };
  if (typeof b.hospital !== "string" || b.hospital.trim().length < 2 || b.hospital.length > 80) {
    return NextResponse.json({ error: "hospital name required, up to 80 characters" }, { status: 400 });
  }
  if (typeof b.admittedAt !== "number" || !Number.isFinite(b.admittedAt)) {
    return NextResponse.json({ error: "admittedAt required, ms since epoch" }, { status: 400 });
  }
  if (typeof b.dischargeRef !== "string" || b.dischargeRef.trim().length < 2 || b.dischargeRef.length > 40) {
    return NextResponse.json({ error: "discharge or admission reference required, up to 40 characters" }, { status: 400 });
  }
  const input = { hospital: b.hospital.trim(), admittedAt: b.admittedAt, dischargeRef: b.dischargeRef.trim() };
  return storeRoute(() => {
    const owner = eventOwner(id);
    if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!keyMatches(owner, riderKey(req))) return forbidden();
    const { event, error } = submitHospital(id, input);
    if (error) return NextResponse.json({ error, event }, { status: 409 });
    return NextResponse.json(event);
  });
}
