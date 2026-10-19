"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/Arrow";
import { PhonePanel } from "@/components/demo/Panels";
import { SensorTrace } from "@/components/demo/SensorTrace";
import { detectCrash, THRESHOLDS } from "@/lib/detector";
import type { Sample } from "@/lib/schema";
import { useSnapshot } from "@/lib/useSnapshot";

// The phone is the sensor. DeviceMotion samples are buffered for 6 seconds
// and posted to the server, which runs the same detector as the demo.

function riderIdFor(): string {
  try {
    const k = "mf-rider-id";
    let v = localStorage.getItem(k);
    if (!v) {
      v = "rider-" + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return "rider-" + Math.random().toString(36).slice(2, 8);
  }
}

export default function RiderPage() {
  const [riderId, setRiderId] = useState("rider-demo");
  const [consented, setConsented] = useState(false);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");
  const [samplesG, setSamplesG] = useState<number[]>([]);
  const [live, setLive] = useState<{ peakG: number; status: string } | null>(null);
  const buf = useRef<Sample[]>([]);
  const pos = useRef<{ lat: number; lng: number; speedKmh?: number } | undefined>(undefined);
  const { snap, refresh } = useSnapshot(riderId, 1000);

  // GPS while on shift. Position is sent with each window so the record and
  // the dispatcher pin are real. Off shift the watch is cleared.
  useEffect(() => {
    if (!snap?.rider.onShift || !("geolocation" in navigator)) {
      pos.current = undefined;
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (g) => {
        pos.current = {
          lat: g.coords.latitude,
          lng: g.coords.longitude,
          speedKmh: g.coords.speed != null && g.coords.speed >= 0 ? Math.round(g.coords.speed * 3.6) : undefined,
        };
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [snap?.rider.onShift]);

  useEffect(() => {
    setRiderId(riderIdFor());
    try {
      setConsented(localStorage.getItem("mf-consent") === "1");
    } catch {}
  }, []);

  const onMotion = useCallback((e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null || a.y === null || a.z === null) return;
    const s: Sample = { t: Date.now(), ax: a.x, ay: a.y, az: a.z };
    buf.current.push(s);
    if (buf.current.length > 600) buf.current.shift();
    const g = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.81;
    setSamplesG((prev) => {
      const next = prev.length > 240 ? prev.slice(-240) : prev.slice();
      next.push(g);
      return next;
    });
  }, []);

  const enableMotion = useCallback(async () => {
    const DM = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<"granted" | "denied"> } | undefined;
    if (!DM) {
      setPermission("unsupported");
      return;
    }
    try {
      if (typeof DM.requestPermission === "function") {
        const r = await DM.requestPermission();
        if (r !== "granted") {
          setPermission("denied");
          return;
        }
      }
      window.addEventListener("devicemotion", onMotion);
      setPermission("granted");
    } catch {
      setPermission("denied");
    }
  }, [onMotion]);

  useEffect(() => () => window.removeEventListener("devicemotion", onMotion), [onMotion]);

  // Post a window every 1.5 s while on shift. Local detector gives instant
  // feedback; the server decides.
  useEffect(() => {
    if (permission !== "granted") return;
    const id = setInterval(async () => {
      const win = buf.current.filter((s) => Date.now() - s.t < 6000);
      if (win.length < 10) return;
      const d = detectCrash(win);
      setLive({ peakG: d.stats.peakG, status: d.isCrash ? `crash, p=${d.confidence.toFixed(2)}` : d.stats.peakG > THRESHOLDS.impactG ? `impact, p=${d.confidence.toFixed(2)}` : `normal, p=${d.confidence.toFixed(2)}` });
      if (!snap?.rider.onShift) return;
      try {
        await fetch("/api/telemetry", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ riderId, samples: win.filter((_, i) => i % 2 === 0), pos: pos.current }),
        });
        if (d.isCrash) refresh();
      } catch {}
    }, 1500);
    return () => clearInterval(id);
  }, [permission, riderId, snap?.rider.onShift, refresh]);

  const setShift = async (on: boolean) => {
    await fetch("/api/shift", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ riderId, onShift: on, platform: "Platform A" }),
    });
    refresh();
  };

  const ok = async () => {
    const e = snap?.events.find((x) => x.status === "detected");
    if (!e) return;
    await fetch(`/api/events/${e.id}/cancel`, { method: "POST" });
    refresh();
  };

  const consent = () => {
    try {
      localStorage.setItem("mf-consent", "1");
    } catch {}
    setConsented(true);
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm opacity-70">
          Metrics
        </Link>
        <span className="mono text-xs opacity-50">{riderId}</span>
      </div>

      {!consented ? (
        <section className="tile tile-paper mt-4 p-6">
          <p className="eyebrow">Before anything is recorded</p>
          <h1 className="display mt-3 text-3xl">Your data. Your record.</h1>
          <ul className="mt-5 space-y-3 text-[15px] leading-relaxed">
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              Motion is read only while you are on shift. Off shift, nothing is read.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              Raw motion stays on this phone. Only a crash event leaves it, after 30 seconds of silence from you.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              Your platform never sees your route, speed, heat or fatigue. They see one thing: a verified event, if there is one.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              You can stop at any time. Stopping deletes the buffer.
            </li>
          </ul>
          <button onClick={consent} className="mt-6 w-full rounded-full bg-ink py-4 text-lg font-medium text-paper">
            I understand, continue
          </button>
          <p className="mt-3 text-xs opacity-60">Demo build. No account, no identity. The rider id above is random and lives in this browser.</p>
        </section>
      ) : (
        <>
          <section className="mt-4">
            {permission !== "granted" ? (
              <div className="tile tile-dusk tile-grain p-6">
                <p className="eyebrow !opacity-80">Step 1</p>
                <h1 className="display mt-2 text-3xl">Turn this phone into the sensor.</h1>
                <p className="mt-3 text-[15px] opacity-90">Allow motion access. iPhone asks once. Then start a shift and drop the phone onto a cushion from about half a metre.</p>
                <button onClick={enableMotion} className="mt-5 w-full rounded-full bg-paper py-4 text-lg font-medium text-ink">
                  Allow motion
                </button>
                {permission === "denied" && <p className="mt-3 text-sm">Motion access was refused. Reload and try again, or use the scripted demo.</p>}
                {permission === "unsupported" && <p className="mt-3 text-sm">This browser has no motion sensors. Open this page on a phone.</p>}
              </div>
            ) : (
              <div className="tile tile-ink h-40 p-4">
                <SensorTrace rider={snap?.rider ?? null} events={snap?.events ?? []} samplesG={samplesG} />
              </div>
            )}
          </section>
          <section className="mt-4">
            <PhonePanel rider={snap?.rider ?? null} events={snap?.events ?? []} onOk={ok} onShift={setShift} live={live} />
          </section>
          <p className="mt-6 text-center text-xs opacity-50">
            Watch it land on the{" "}
            <Link href="/demo" className="underline">
              demo
            </Link>{" "}
            or{" "}
            <Link href="/dispatch" className="underline">
              dispatcher
            </Link>{" "}
            screen.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem("mf-consent");
              } catch {}
              setConsented(false);
              window.removeEventListener("devicemotion", onMotion);
              setPermission("idle");
              buf.current = [];
            }}
            className="arrow-link mx-auto mt-6 block text-sm opacity-70"
          >
            Withdraw consent and stop <Arrow size={14} />
          </button>
        </>
      )}
    </main>
  );
}
