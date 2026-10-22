import { NextResponse } from "next/server";
import { DEMO_RIDER, replay, setContext, setDeadline, setSecondApp, simCrash, simFeedback, simHospital, simOk, simReset, simStart, snapshot } from "@/lib/store";
import { clientIp, limited, storeRoute } from "@/lib/api";

// The scripted demo rider. Only ever touches rider-demo. Reset clears the
// shared hazard map, so it needs DEMO_KEY when one is set, and is rate limited.
export async function POST(req: Request) {
  const { action, value, key } = (await req.json().catch(() => ({}))) as { action?: string; value?: unknown; key?: unknown };
  if (action === "reset") {
    if (process.env.DEMO_KEY && key !== process.env.DEMO_KEY) return NextResponse.json({ error: "demo key required to reset" }, { status: 403 });
    if (limited(`reset:${clientIp(req)}`, 3, 60_000)) return NextResponse.json({ error: "too many resets" }, { status: 429 });
  }
  return storeRoute(() => {
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
        if (!replay(value)) return NextResponse.json({ error: "unknown scenario" }, { status: 400 });
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
      case "hospital":
        body = simHospital();
        break;
      case "feedback":
        if (value !== "false_alarm" && value !== "real_fall" && value !== "unsure") return NextResponse.json({ error: "label required" }, { status: 400 });
        body = simFeedback(value);
        break;
      case "secondApp":
        setSecondApp(DEMO_RIDER, Boolean(value));
        body = snapshot(DEMO_RIDER);
        break;
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json(body);
  });
}
