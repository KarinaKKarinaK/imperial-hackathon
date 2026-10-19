import { NextResponse } from "next/server";
import { setShift } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { riderId?: unknown; onShift?: unknown; platform?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) {
    return NextResponse.json({ error: "riderId required" }, { status: 400 });
  }
  const platform = b.platform === "Platform A" || b.platform === "Platform B" ? b.platform : undefined;
  return NextResponse.json(setShift(b.riderId, Boolean(b.onShift), platform));
}
