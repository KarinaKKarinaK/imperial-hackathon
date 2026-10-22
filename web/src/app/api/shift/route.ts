import { NextResponse } from "next/server";
import { authorizeRider, publicRider, setSecondApp, setShift } from "@/lib/store";
import { forbidden, riderKey, storeRoute } from "@/lib/api";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { riderId?: unknown; onShift?: unknown; platform?: unknown; secondApp?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) {
    return NextResponse.json({ error: "riderId required" }, { status: 400 });
  }
  const riderId = b.riderId;
  const platform = b.platform === "Platform A" || b.platform === "Platform B" ? b.platform : undefined;
  return storeRoute(() => {
    if (!authorizeRider(riderId, riderKey(req))) return forbidden();
    let r = setShift(riderId, Boolean(b.onShift), platform);
    if (typeof b.secondApp === "boolean") r = setSecondApp(riderId, b.secondApp);
    return NextResponse.json(publicRider(r, true));
  });
}
