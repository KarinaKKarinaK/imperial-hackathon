import { NextResponse } from "next/server";
import { cancelEvent } from "@/lib/store";


export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const e = cancelEvent(id);
  if (!e) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(e);
}
