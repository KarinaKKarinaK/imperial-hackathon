import { NextResponse } from "next/server";
import { DEMO_RIDER, flush, hydrate, replay, setContext, setDeadline, simCrash, simOk, simReset, simStart, snapshot } from "@/lib/store";

export async function POST(req: Request) {
  await hydrate();
  const { action, value } = (await req.json().catch(() => ({}))) as { action?: string; value?: unknown };
  let body: unknown;
  switch (action) {
    case "start":
      body = simStart();
      break;
    case "crash":
      body = simCrash();
      break;
    case "ok":
      body = simOk();
      break;
    case "reset":
      body = simReset();
      break;
    case "replay": {
      if (typeof value !== "string") return NextResponse.json({ error: "scenario required" }, { status: 400 });
      const out = replay(value);
      if (!out) return NextResponse.json({ error: "unknown scenario" }, { status: 400 });
      body = snapshot(DEMO_RIDER);
      break;
    }
    case "rain":
      setContext(DEMO_RIDER, { rain: Boolean(value) });
      body = snapshot(DEMO_RIDER);
      break;
    case "heat":
      if (value === "green" || value === "amber" || value === "red") setContext(DEMO_RIDER, { heat: value });
      body = snapshot(DEMO_RIDER);
      break;
    case "deadline":
      if (typeof value === "number" && value >= 0 && value <= 240) setDeadline(DEMO_RIDER, value);
      body = snapshot(DEMO_RIDER);
      break;
    case "platform":
      if (value === "Platform A" || value === "Platform B") setContext(DEMO_RIDER, { platform: value });
      body = snapshot(DEMO_RIDER);
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  await flush();
  return NextResponse.json(body);
}
