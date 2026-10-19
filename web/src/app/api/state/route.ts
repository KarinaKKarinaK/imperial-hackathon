import { connection, NextResponse } from "next/server";
import { allSnapshot, DEMO_RIDER, flush, hydrate, snapshot } from "@/lib/store";

export async function GET(req: Request) {
  await connection();
  await hydrate();
  const url = new URL(req.url);
  const riderId = url.searchParams.get("riderId");
  const body = riderId === "all" ? allSnapshot() : snapshot(riderId && riderId.length <= 64 ? riderId : DEMO_RIDER);
  await flush();
  return NextResponse.json(body);
}
