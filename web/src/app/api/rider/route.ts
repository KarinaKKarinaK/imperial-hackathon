import { NextResponse } from "next/server";
import { authorizeRider, publicRider, setDeadline, setEmergencyContact } from "@/lib/store";
import type { RiderState } from "@/lib/schema";
import { forbidden, riderKey, storeRoute } from "@/lib/api";

// Rider-side settings: the order countdown and the emergency contact.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { riderId?: unknown; deadlineMinutes?: unknown; emergencyContact?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) {
    return NextResponse.json({ error: "riderId required" }, { status: 400 });
  }
  const riderId = b.riderId;
  return storeRoute(() => {
    if (!authorizeRider(riderId, riderKey(req))) return forbidden();
    let rider: RiderState | null = null;
    if (b.deadlineMinutes === null || (typeof b.deadlineMinutes === "number" && b.deadlineMinutes >= 0 && b.deadlineMinutes <= 240)) {
      rider = setDeadline(riderId, b.deadlineMinutes as number | null);
    }
    if (b.emergencyContact === null || (typeof b.emergencyContact === "string" && b.emergencyContact.length <= 24)) {
      rider = setEmergencyContact(riderId, b.emergencyContact as string | null);
    }
    if (!rider) return NextResponse.json({ error: "nothing to set" }, { status: 400 });
    return NextResponse.json(publicRider(rider, true));
  });
}
