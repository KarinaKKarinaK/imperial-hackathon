import { NextResponse } from "next/server";
import { DEMO_RIDER, replay, setContext, simCrash, simOk, simReset, simStart, hydrate } from "@/lib/store";


export async function POST(req: Request) {
  await hydrate();
  const { action, value } = (await req.json().catch(() => ({}))) as { action?: string; value?: unknown };
  switch (action) {
    case "start":
      return NextResponse.json(simStart());
    case "crash":
      return NextResponse.json(simCrash());
    case "ok":
      return NextResponse.json(simOk());
    case "reset":
      return NextResponse.json(simReset());
    case "replay": {
      if (typeof value !== "string") return NextResponse.json({ error: "scenario required" }, { status: 400 });
      const out = replay(value);
      if (!out) return NextResponse.json({ error: "unknown scenario" }, { status: 400 });
      break;
    }
    case "rain":
      setContext(DEMO_RIDER, { rain: Boolean(value) });
      break;
    case "heat":
      if (value === "green" || value === "amber" || value === "red") setContext(DEMO_RIDER, { heat: value });
      break;
    case "platform":
      if (value === "Platform A" || value === "Platform B") setContext(DEMO_RIDER, { platform: value });
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  const { snapshot } = await import("@/lib/store");
  return NextResponse.json(snapshot(DEMO_RIDER));
}
