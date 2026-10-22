import { NextResponse } from "next/server";
import { eventOwner, keyMatches, setFeedback } from "@/lib/store";
import { forbidden, riderKey, storeRoute } from "@/lib/api";

// After a cancel or payout the rider says what it was: a weak training label.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as { label?: unknown };
  if (b.label !== "false_alarm" && b.label !== "real_fall" && b.label !== "unsure") {
    return NextResponse.json({ error: "label must be false_alarm, real_fall or unsure" }, { status: 400 });
  }
  const label = b.label;
  return storeRoute(() => {
    const owner = eventOwner(id);
    if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!keyMatches(owner, riderKey(req))) return forbidden();
    const e = setFeedback(id, label);
    if (!e) return NextResponse.json({ error: "event still in its cancel window" }, { status: 409 });
    return NextResponse.json(e);
  });
}
