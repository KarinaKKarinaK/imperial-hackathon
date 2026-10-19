"use client";

import Link from "next/link";
import { DispatcherPanel, PipelineStatus } from "@/components/demo/Panels";
import { useSnapshot } from "@/lib/useSnapshot";
import type { EventRecord, RiderState } from "@/lib/schema";
import { useEffect, useState } from "react";

type All = { riders: RiderState[]; events: EventRecord[] };

export default function DispatchPage() {
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
        <Link href="/" className="text-sm opacity-70">MetricsFile</Link>
        <span className="eyebrow">Dispatcher console</span>
      </div>
      <div className="mt-4"><PipelineStatus events={events} rider={snap?.rider ?? null} /></div>
      <section className="tile tile-paper mt-4 min-h-[70vh] p-6">
        <DispatcherPanel events={events} />
      </section>
      <p className="mt-4 text-xs opacity-50">{all?.riders.filter((r) => r.onShift).length ?? 0} rider(s) on shift across all clients.</p>
    </main>
  );
}
