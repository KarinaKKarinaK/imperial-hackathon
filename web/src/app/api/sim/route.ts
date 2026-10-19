import { NextResponse } from "next/server";
import { DEMO_RIDER, setContext, simCrash, simOk, simReset, simStart } from "@/lib/store";


export async function POST(req: Request) {
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
