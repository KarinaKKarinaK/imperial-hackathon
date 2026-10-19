"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventRecord, HazardCell, RiderState } from "./schema";

export type Snapshot = {
  rider: RiderState;
  events: EventRecord[];
  others: RiderState[];
  allEvents: EventRecord[];
  hazards: HazardCell[];
  deadlineSec: number | null;
  premiumWindowHkd: number;
  route: [number, number][];
  serverTime: number;
};

export function useSnapshot(riderId = "rider-demo", intervalMs = 1000) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/state?riderId=${encodeURIComponent(riderId)}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      setSnap((await r.json()) as Snapshot);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    }
  }, [riderId]);

  useEffect(() => {
    refresh();
    timer.current = window.setInterval(refresh, intervalMs);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh, intervalMs]);

  const act = useCallback(
    async (action: string, value?: unknown) => {
      const r = await fetch("/api/sim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, value }),
      });
      if (r.ok) setSnap((await r.json()) as Snapshot);
    },
    [],
  );

  return { snap, error, refresh, act };
}
