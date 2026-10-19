import { NextResponse } from "next/server";
import { flush, hydrate, setShift } from "@/lib/store";

export async function POST(req: Request) {
  await hydrate();
  const b = (await req.json().catch(() => ({}))) as { riderId?: unknown; onShift?: unknown; platform?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) {
    return NextResponse.json({ error: "riderId required" }, { status: 400 });
  }
  const platform = b.platform === "Platform A" || b.platform === "Platform B" ? b.platform : undefined;
  const body = setShift(b.riderId, Boolean(b.onShift), platform);
  await flush();
  return NextResponse.json(body);
}
