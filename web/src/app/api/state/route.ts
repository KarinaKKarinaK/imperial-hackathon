import { connection, NextResponse } from "next/server";
import { allSnapshot, DEMO_RIDER, snapshot, hydrate } from "@/lib/store";


export async function GET(req: Request) {
  await hydrate();
  await connection();
  const url = new URL(req.url);
  const riderId = url.searchParams.get("riderId");
  if (riderId === "all") return NextResponse.json(allSnapshot());
  return NextResponse.json(snapshot(riderId && riderId.length <= 64 ? riderId : DEMO_RIDER));
}
