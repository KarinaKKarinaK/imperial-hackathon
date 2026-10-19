import { NextResponse } from "next/server";
import { flush, hydrate, setDeadline, setEmergencyContact } from "@/lib/store";

// Rider-side settings: the order countdown and the emergency contact.
export async function POST(req: Request) {
  await hydrate();
  const b = (await req.json().catch(() => ({}))) as { riderId?: unknown; deadlineMinutes?: unknown; emergencyContact?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) {
    return NextResponse.json({ error: "riderId required" }, { status: 400 });
  }
  let rider = null;
  if (b.deadlineMinutes === null || (typeof b.deadlineMinutes === "number" && b.deadlineMinutes >= 0 && b.deadlineMinutes <= 240)) {
    rider = setDeadline(b.riderId, b.deadlineMinutes as number | null);
  }
  if (b.emergencyContact === null || (typeof b.emergencyContact === "string" && b.emergencyContact.length <= 24)) {
    rider = setEmergencyContact(b.riderId, b.emergencyContact as string | null);
  }
  if (!rider) return NextResponse.json({ error: "nothing to set" }, { status: 400 });
  await flush();
  return NextResponse.json(rider);
}
