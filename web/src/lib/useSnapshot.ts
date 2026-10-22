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

// riderKey: the rider's own device key. With it the server returns the
// rider's emergency contact; without it, a redacted view.
export function useSnapshot(riderId = "rider-demo", intervalMs = 1000, riderKey?: string) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [skewMs, setSkewMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/state?riderId=${encodeURIComponent(riderId)}`, {
        cache: "no-store",
        headers: riderKey ? { "x-rider-key": riderKey } : undefined,
      });
      if (!r.ok) throw new Error(String(r.status));
      const s = (await r.json()) as Snapshot;
      setSkewMs(s.serverTime - Date.now()); // countdowns follow the server clock, not a phone that runs fast
      setSnap(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    }
  }, [riderId, riderKey]);

  useEffect(() => {
    // First fetch on the next tick, so no state is set inside the effect body.
    const first = window.setTimeout(refresh, 0);
    timer.current = window.setInterval(refresh, intervalMs);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(first);
      if (timer.current) window.clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh, intervalMs]);

  const act = useCallback(
    async (action: string, value?: unknown) => {
      // A presenter can open /demo?key=... so Reset works when DEMO_KEY is set.
      const key = new URLSearchParams(window.location.search).get("key") ?? undefined;
      const r = await fetch("/api/sim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, value, key }),
      });
      if (r.ok) setSnap((await r.json()) as Snapshot);
    },
    [],
  );

  return { snap, error, refresh, act, skewMs };
}
