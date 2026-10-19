"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Arrow } from "@/components/Arrow";
import { Controls } from "@/components/demo/Controls";
import { DispatcherPanel, PhonePanel, PipelineStatus, UnderwriterPanel, useNow } from "@/components/demo/Panels";
import { SensorTrace } from "@/components/demo/SensorTrace";
import { useSnapshot } from "@/lib/useSnapshot";

const MapScene = dynamic(() => import("@/components/demo/MapScene").then((m) => m.MapScene), { ssr: false });

export default function DemoPage() {
  const { snap, act, error } = useSnapshot("rider-demo", 1000);
  const now = useNow(500);
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/rider`, { margin: 1, width: 160, color: { dark: "#0a0a0a", light: "#f3f3f0" } }).then(setQr).catch(() => {});
  }, []);

  const rider = snap?.rider ?? null;
  const events = snap?.events ?? [];
  const hasActive = events.some((e) => e.status === "detected" && e.cancelDeadline > now);

  return (
    <main className="min-h-dvh px-3 pb-6 pt-3 sm:px-4">
      {/* top bar */}
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 rounded-full border border-white/20 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <span className="relative block h-4 w-7">
            <span className="absolute left-0 top-0 h-4 w-4 rounded-full bg-paper" />
            <span className="absolute left-3 top-0 h-4 w-4 rounded-full bg-paper" />
          </span>
          Metrics
          <span className="hidden opacity-50 sm:inline">/ live pipeline</span>
        </Link>
        <div className="hidden md:block">
          <PipelineStatus events={events} rider={rider} />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${error ? "bg-peach" : "bg-violet-2"}`} />
          <span className="opacity-60">{error ? "backend unreachable" : "backend live"}</span>
        </div>
      </div>

      <div className="mx-auto mt-3 md:hidden">
        <PipelineStatus events={events} rider={rider} />
      </div>

      {/* grid */}
      <div className="mx-auto mt-3 grid max-w-[1600px] gap-3 lg:grid-cols-12">
        {/* map */}
        <div className="tile tile-ink relative min-h-[380px] lg:col-span-8 lg:h-[58vh] lg:min-h-[480px]">
          <MapScene rider={rider} route={snap?.route ?? []} events={events} className="h-full min-h-[380px]" />
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="pill pill-paper">Mong Kok, Kowloon</span>
            {rider?.onShift && <span className="pill pill-outline">{rider.platform}, {rider.jobId}</span>}
            {rider?.onShift && <span className="pill pill-outline">{rider.speedKmh} km/h</span>}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-2xl border border-white/15 bg-ink/80 p-3 backdrop-blur">
              <Controls rider={rider} act={act} hasActive={hasActive} />
            </div>
          </div>
        </div>

        {/* phone */}
        <div className="tile tile-night flex flex-col items-center p-5 lg:col-span-4">
          <p className="eyebrow self-start">Rider&apos;s phone</p>
          <div className="my-4 w-full flex-1 flex items-center">
            <PhonePanel rider={rider} events={events} onOk={() => act("ok")} />
          </div>
          <div className="mt-auto flex w-full items-center gap-4 rounded-2xl border border-white/15 p-3">
            {qr ? <img src={qr} alt="QR code to open the rider client" className="h-20 w-20 rounded-lg" /> : <div className="h-20 w-20 rounded-lg bg-white/5" />}
            <div className="text-sm">
              <p className="font-medium">Use a real phone as the sensor</p>
              <p className="mt-1 text-xs opacity-60">Scan, allow motion, start a shift, then drop the phone onto a cushion. Events land here.</p>
              <Link href="/rider" className="arrow-link mt-2 text-xs">
                /rider <Arrow size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* trace */}
        <div className="tile tile-night flex min-h-[240px] flex-col p-5 lg:col-span-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Helmet sensor</p>
            <span className="mono text-xs opacity-50">100 Hz</span>
          </div>
          <div className="mt-3 flex-1">
            <SensorTrace rider={rider} events={events} />
          </div>
          {rider?.lastWindow && (
            <p className="mono mt-2 text-xs opacity-60">
              peak {rider.lastWindow.peakG.toFixed(1)} g, tilt {Math.round(rider.lastWindow.tiltDeg)} deg, still {rider.lastWindow.stillSec.toFixed(1)} s
            </p>
          )}
        </div>

        {/* dispatcher */}
        <div className="tile tile-paper min-h-[240px] p-5 lg:col-span-4">
          <DispatcherPanel events={events} />
        </div>

        {/* underwriter */}
        <div className="tile tile-dusk tile-grain min-h-[240px] p-5 lg:col-span-4">
          <UnderwriterPanel rider={rider} events={events} premium={snap?.premiumWindowHkd ?? 0} />
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[1600px] px-2 text-xs opacity-50">
        Detector, record, cancel window, triage and payout all run on the server. Money figures are illustrative.
      </p>
    </main>
  );
}
