import { NextResponse } from "next/server";
import { cancelEvent, DEMO_RIDER, eventOwner, keyMatches, SAMPLE_RIDER } from "@/lib/store";
import { forbidden, riderKey, storeRoute } from "@/lib/api";

// Only the rider who owns the event can cancel it, with the key their phone
// holds. The scripted demo rider cancels through /api/sim.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return storeRoute(() => {
    const owner = eventOwner(id);
    if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (owner === DEMO_RIDER || owner === SAMPLE_RIDER || !keyMatches(owner, riderKey(req))) return forbidden();
    const { event, cancelled } = cancelEvent(id);
    if (!cancelled) return NextResponse.json({ error: "too late to cancel", event }, { status: 409 });
    return NextResponse.json(event);
  });
}
