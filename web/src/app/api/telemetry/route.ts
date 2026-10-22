import { NextResponse } from "next/server";
import { authorizeRider, ingest } from "@/lib/store";
import { clientIp, forbidden, limited, riderKey, storeRoute } from "@/lib/api";
import type { Sample } from "@/lib/schema";

function isSample(x: unknown): x is Sample {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return ["t", "ax", "ay", "az"].every((k) => typeof s[k] === "number" && Number.isFinite(s[k] as number));
}

// A window must be 1 to 2000 samples, in time order, span 0.5 to 8 s and end
// within a minute of now. Anything else is refused before the detector runs,
// so one request cannot make the resampler allocate billions of rows.
function validWindow(x: unknown): x is Sample[] {
  if (!Array.isArray(x) || x.length < 1 || x.length > 2000 || !x.every(isSample)) return false;
  for (let i = 1; i < x.length; i++) if (x[i].t < x[i - 1].t) return false;
  const span = x[x.length - 1].t - x[0].t;
  return span >= 500 && span <= 8000 && Math.abs(x[x.length - 1].t - Date.now()) < 60_000;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = body as { riderId?: unknown; samples?: unknown; phoneSamples?: unknown; source?: unknown; pos?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) {
    return NextResponse.json({ error: "riderId required" }, { status: 400 });
  }
  if (limited(b.riderId, 6, 3000) || limited(`ip:${clientIp(req)}`, 20, 3000)) {
    return NextResponse.json({ error: "too many windows, slow down" }, { status: 429 });
  }
  if (!validWindow(b.samples)) {
    return NextResponse.json({ error: "samples must be 1 to 2000 {t,ax,ay,az} in time order, 0.5 to 8 s long, ending now" }, { status: 400 });
  }
  if (b.phoneSamples !== undefined && !validWindow(b.phoneSamples)) {
    return NextResponse.json({ error: "phoneSamples invalid" }, { status: 400 });
  }
  const source = b.source === "helmet" ? "helmet" : "phone";
  let pos: { lat: number; lng: number; speedKmh?: number } | undefined;
  if (b.pos && typeof b.pos === "object") {
    const p = b.pos as Record<string, unknown>;
    if (typeof p.lat === "number" && typeof p.lng === "number" && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) {
      pos = { lat: p.lat, lng: p.lng, speedKmh: typeof p.speedKmh === "number" && p.speedKmh >= 0 && p.speedKmh < 200 ? p.speedKmh : undefined };
    }
  }
  const riderId = b.riderId;
  const samples = b.samples;
  const phoneSamples = b.phoneSamples as Sample[] | undefined;
  return storeRoute(() => {
    if (!authorizeRider(riderId, riderKey(req))) return forbidden();
    const out = ingest(riderId, samples, pos, { source, phoneSamples });
    return NextResponse.json({ detection: out.detection, event: out.event, sources: out.sources, onShift: out.rider.onShift });
  });
}
