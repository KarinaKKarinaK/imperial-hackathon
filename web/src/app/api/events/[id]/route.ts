import { NextResponse } from "next/server";
import { hydrate, listEvents } from "@/lib/store";
import { publicKeyPem } from "@/lib/sign";

// The rider's export: one record, its signature, and the key to check it.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await hydrate();
  const { id } = await ctx.params;
  const e = listEvents().find((x) => x.id === id);
  if (!e) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(
    { record: e, publicKey: publicKeyPem(), verifyAt: "https://metricsfile.vercel.app/api/verify", schema: "https://metricsfile.vercel.app/api/schema" },
    { headers: { "content-disposition": `inline; filename="${e.id}.json"` } },
  );
}
