import { connection, NextResponse } from "next/server";
import { allSnapshot, DEMO_RIDER, keyMatches, snapshot } from "@/lib/store";
import { riderKey, storeRoute } from "@/lib/api";

// Polling an id never creates a rider. The rider's own contact is returned
// only with the rider's key.
export async function GET(req: Request) {
  await connection();
  const url = new URL(req.url);
  const id = url.searchParams.get("riderId");
  const riderId = id && id.length <= 64 ? id : DEMO_RIDER;
  return storeRoute(() =>
    NextResponse.json(id === "all" ? allSnapshot() : snapshot(riderId, keyMatches(riderId, riderKey(req)))),
  );
}
