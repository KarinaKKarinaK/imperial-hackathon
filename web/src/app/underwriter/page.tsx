"use client";

import Link from "next/link";
import { PipelineStatus, UnderwriterPanel } from "@/components/demo/Panels";
import { useSnapshot } from "@/lib/useSnapshot";
import type { EventRecord, RiderState } from "@/lib/schema";
import { useEffect, useState } from "react";

type All = { riders: RiderState[]; events: EventRecord[] };

export default function UnderwriterPage() {
  const { snap } = useSnapshot("rider-demo", 1000);
  const [all, setAll] = useState<All | null>(null);
  useEffect(() => {
    const load = () => fetch("/api/state?riderId=all", { cache: "no-store" }).then((r) => r.json()).then(setAll).catch(() => {});
    load();
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, []);
  const events = all?.events ?? snap?.events ?? [];
  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 pb-10 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm opacity-70">Metrics</Link>
        <span className="eyebrow">Underwriter console</span>
      </div>
      <div className="mt-4"><PipelineStatus events={events} rider={snap?.rider ?? null} /></div>
      <section className="tile tile-dusk tile-grain mt-4 min-h-[70vh] p-6">
        <UnderwriterPanel rider={snap?.rider ?? null} events={events} premium={snap?.premiumWindowHkd ?? 0} />
      </section>
      <p className="mt-4 text-xs opacity-50">Money on this screen is the central case of our model: tier one is half a month of average rider income (HK$10,900, Labour Department survey), the premium comes from injury rates and statutory amounts. Range and sources: docs/research/INSURANCE_MODEL.md. No insurer has signed yet; a licensed insurer would carry the risk, not Metrics.</p>
    </main>
  );
}
