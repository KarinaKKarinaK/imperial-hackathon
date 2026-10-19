"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Arrow } from "../Arrow";
import { Reveal } from "../Reveal";
import { useSnapshot } from "@/lib/useSnapshot";

const MapScene = dynamic(() => import("../demo/MapScene").then((m) => m.MapScene), { ssr: false });

type Weather = { source: string; place: string; tempC: number; humidity: number; raining: boolean; heat: string };

export function LiveStrip() {
  const { snap } = useSnapshot("rider-demo", 2000);
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then(setW)
      .catch(() => {});
  }, []);

  return (
    <section className="px-4 pt-6 sm:px-6">
      <div className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-12">
        <Reveal className="tile tile-ink min-h-[380px] md:col-span-8 md:min-h-[520px]">
          <MapScene rider={snap?.rider ?? null} route={snap?.route ?? []} events={snap?.events ?? []} className="h-full min-h-[380px] md:min-h-[520px]" compact />
          <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="pill pill-paper">Kowloon, live</span>
            <span className="pill pill-outline">
              {snap?.rider.onShift ? `Rider on shift, ${snap.rider.speedKmh} km/h` : "Rider off shift"}
            </span>
          </div>
          <Link
            href="/demo"
            className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:bg-violet hover:text-white"
          >
            Open the full demo <Arrow size={16} />
          </Link>
        </Reveal>
        <div className="grid gap-4 md:col-span-4">
          <Reveal delay={0.08} className="tile tile-paper p-6">
            <p className="eyebrow">Hong Kong Observatory, now</p>
            {w ? (
              <>
                <p className="num mt-3 text-5xl">{w.tempC}°C</p>
                <p className="mt-2 text-sm opacity-75">
                  {w.place}. Humidity {w.humidity}%. {w.raining ? "Raining." : "Dry."}
                </p>
                <span className={`pill mt-4 ${w.heat === "red" ? "pill-peach" : w.heat === "amber" ? "pill-lemon" : "pill-ink"}`}>
                  Heat band {w.heat}
                </span>
                <p className="mt-4 text-xs opacity-50">{w.source === "fallback" ? "Fallback reading." : "Drives the rider's heat alert."}</p>
              </>
            ) : (
              <p className="mt-3 text-sm opacity-60">Fetching the current reading.</p>
            )}
          </Reveal>
          <Reveal delay={0.14} className="tile tile-dusk tile-grain flex flex-col justify-between p-6">
            <p className="eyebrow !opacity-80">Right now</p>
            <div>
              <p className="num text-5xl">{snap ? snap.events.length : 0}</p>
              <p className="mt-2 text-sm opacity-90">events in the record. Premium this window HK${snap?.premiumWindowHkd.toFixed(2) ?? "0.00"}.</p>
            </div>
            <p className="mt-4 text-xs opacity-75">Open /rider on a phone and drop it. It lands here.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
