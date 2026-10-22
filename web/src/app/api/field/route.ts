import { NextResponse } from "next/server";
import { authorizeRider, prepareDonation, pushField, type FieldKind, type FieldLabel } from "@/lib/store";
import { forbidden, limited, riderKey, storeRoute } from "@/lib/api";
import type { Sample } from "@/lib/schema";

// Research mode: a rider who opted in donates a labelled sensor window.
// "ride": 20 to 125 s of normal riding (real negatives, and real riding hours
// for the false alarm rate). "event": the 6 s window behind an alarm, with the
// rider's own label.
const LABELS: Record<FieldKind, FieldLabel[]> = { ride: ["riding"], event: ["crash", "false_alarm", "real_fall", "unsure"] };

function valid(x: unknown, kind: FieldKind): x is Sample[] {
  if (!Array.isArray(x) || x.length < 10 || x.length > 12000) return false;
  for (let i = 0; i < x.length; i++) {
    const s = x[i] as Record<string, unknown>;
    if (!["t", "ax", "ay", "az"].every((k) => typeof s?.[k] === "number" && Number.isFinite(s[k] as number))) return false;
    if (i > 0 && (s.t as number) < (x[i - 1] as Sample).t) return false;
  }
  const span = (x[x.length - 1] as Sample).t - (x[0] as Sample).t;
  const [lo, hi] = kind === "ride" ? [20_000, 125_000] : [500, 8000];
  return span >= lo && span <= hi && Math.abs((x[x.length - 1] as Sample).t - Date.now()) < 15 * 60_000;
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { riderId?: unknown; kind?: unknown; label?: unknown; source?: unknown; samples?: unknown };
  if (typeof b.riderId !== "string" || b.riderId.length > 64) return NextResponse.json({ error: "riderId required" }, { status: 400 });
  if (b.kind !== "ride" && b.kind !== "event") return NextResponse.json({ error: "kind must be ride or event" }, { status: 400 });
  const kind: FieldKind = b.kind;
  if (!LABELS[kind].includes(b.label as FieldLabel)) return NextResponse.json({ error: `label must be one of ${LABELS[kind].join(", ")}` }, { status: 400 });
  if (!valid(b.samples, kind)) return NextResponse.json({ error: "samples must be in time order, 10 to 12000, ending recently, 20 to 125 s for a ride or 0.5 to 8 s for an event" }, { status: 400 });
  if (limited(`field:${b.riderId}`, 30, 3_600_000)) return NextResponse.json({ error: "too many donations this hour" }, { status: 429 });
  const riderId = b.riderId;
  const input = { kind, label: b.label as FieldLabel, source: b.source === "helmet" ? ("helmet" as const) : ("phone" as const), samples: b.samples };
  let entry: Record<string, unknown> | null = null;
  const res = await storeRoute(() => {
    if (!authorizeRider(riderId, riderKey(req))) return forbidden();
    const out = prepareDonation(riderId, input);
    if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status });
    entry = out.entry;
    return NextResponse.json({ id: out.entry.id, kind, label: input.label });
  });
  if (entry) {
    try {
      await pushField(entry);
    } catch {
      return NextResponse.json({ error: "storage busy, try again" }, { status: 503 });
    }
  }
  return res;
}
