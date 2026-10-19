import { NextResponse } from "next/server";
import { ingest, hydrate, flush } from "@/lib/store";
import type { Sample } from "@/lib/schema";


function isSample(x: unknown): x is Sample {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return ["t", "ax", "ay", "az"].every((k) => typeof s[k] === "number" && Number.isFinite(s[k] as number));
}

// ponytail: per-instance token bucket. Enough to stop a runaway script; move to
// Redis if abuse ever matters.
const buckets = new Map<string, number[]>();
function limited(key: string, max = 6, windowMs = 3000): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) buckets.clear();
  return arr.length > max;
}

export async function POST(req: Request) {
  await hydrate();
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
  if (limited(b.riderId)) {
    return NextResponse.json({ error: "too many windows, slow down" }, { status: 429 });
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
  await flush();
  return NextResponse.json(out);
}
