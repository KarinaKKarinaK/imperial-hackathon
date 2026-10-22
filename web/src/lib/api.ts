import { NextResponse } from "next/server";
import { withStore } from "./store";

// Run a handler inside a load, change, save cycle. Storage failures become a
// 503 the client can retry, never a silent loss.
export async function storeRoute(fn: () => Response | Promise<Response>): Promise<Response> {
  try {
    return await withStore(fn);
  } catch {
    return NextResponse.json({ error: "storage busy, try again" }, { status: 503 });
  }
}

export function riderKey(req: Request): string | null {
  return req.headers.get("x-rider-key");
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// ponytail: per-instance sliding window. Stops a runaway script; move to Redis
// if abuse across instances ever matters.
const buckets = new Map<string, number[]>();
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) buckets.clear();
  return arr.length > max;
}

export const forbidden = () => NextResponse.json({ error: "rider key missing or wrong" }, { status: 403 });
