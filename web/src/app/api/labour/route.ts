import { connection, NextResponse } from "next/server";
import { labourAggregate } from "@/lib/store";
import { storeRoute } from "@/lib/api";

// Labour Department and Tripartite Committee view: aggregates only.
export async function GET() {
  await connection();
  return storeRoute(() => NextResponse.json(labourAggregate()));
}
