import { NextResponse } from "next/server";
import { ingest } from "@/lib/store";
import type { Sample } from "@/lib/schema";


function isSample(x: unknown): x is Sample {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return ["t", "ax", "ay", "az"].every((k) => typeof s[k] === "number" && Number.isFinite(s[k] as number));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = body as { riderId?: unknown; samples?: unknown; pos?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) {
    return NextResponse.json({ error: "riderId required" }, { status: 400 });
  }
  if (!Array.isArray(b.samples) || b.samples.length === 0 || b.samples.length > 2000 || !b.samples.every(isSample)) {
    return NextResponse.json({ error: "samples must be 1 to 2000 {t,ax,ay,az}" }, { status: 400 });
  }
  let pos: { lat: number; lng: number; speedKmh?: number } | undefined;
  if (b.pos && typeof b.pos === "object") {
    const p = b.pos as Record<string, unknown>;
    if (typeof p.lat === "number" && typeof p.lng === "number" && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) {
      pos = { lat: p.lat, lng: p.lng, speedKmh: typeof p.speedKmh === "number" ? p.speedKmh : undefined };
    }
  }
  const out = ingest(b.riderId, b.samples, pos);
  return NextResponse.json(out);
}
