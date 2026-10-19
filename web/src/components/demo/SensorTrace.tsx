"use client";

import { useEffect, useRef } from "react";
import type { EventRecord, RiderState } from "@/lib/schema";

// Live resultant-acceleration trace. Riding is 1 g with vibration; a crash is
// the spike, the swing, then the flat line. Drawn on a canvas at 60 fps.
export function SensorTrace({
  rider,
  events,
  samplesG,
  className = "",
}: {
  rider: RiderState | null;
  events: EventRecord[];
  samplesG?: number[]; // optional real data from a phone
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const buf = useRef<number[]>(new Array(240).fill(1));
  const crashT = useRef<number | null>(null);

  useEffect(() => {
    const latest = events.find((e) => e.status !== "cancelled");
    crashT.current = latest ? latest.ts : null;
  }, [events]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let t = 0;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // next sample
      let next: number;
      if (samplesG && samplesG.length) {
        next = samplesG[samplesG.length - 1];
      } else {
        const riding = rider?.onShift && (rider?.speedKmh ?? 0) > 0;
        const since = crashT.current ? (Date.now() - crashT.current) / 1000 : null;
        if (since !== null && since >= 0 && since < 0.6) next = 14.2 * Math.exp(-((since - 0.08) ** 2) / 0.004) + 1;
        else if (since !== null && since >= 0.6 && since < 1.6) next = 1 + Math.sin(since * 20) * 0.9 * Math.exp(-(since - 0.6) * 3);
        else if (since !== null && since >= 1.6) next = 1 + (Math.random() - 0.5) * 0.02;
        else if (riding) next = 1 + (Math.random() - 0.5) * 0.35 + Math.sin(t / 7) * 0.08;
        else next = 1 + (Math.random() - 0.5) * 0.03;
      }
      buf.current.push(next);
      if (buf.current.length > 240) buf.current.shift();
      t++;

      const max = 16;
      const y = (g: number) => h - 10 - (Math.min(max, g) / max) * (h - 20);

      // threshold line
      ctx.strokeStyle = "rgba(240,160,112,0.5)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, y(6));
      ctx.lineTo(w, y(6));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(240,160,112,0.8)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText("6 g impact threshold", 8, y(6) - 6);

      // trace
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#f3f3f0";
      ctx.beginPath();
      buf.current.forEach((g, i) => {
        const x = (i / 239) * w;
        if (i === 0) ctx.moveTo(x, y(g));
        else ctx.lineTo(x, y(g));
      });
      ctx.stroke();

      // glow under peaks
      const peak = Math.max(...buf.current);
      if (peak > 6) {
        ctx.fillStyle = "rgba(240,160,112,0.12)";
        ctx.fillRect(0, 0, w, h);
      }

      // readout
      ctx.fillStyle = "#f3f3f0";
      ctx.font = "500 12px ui-monospace, monospace";
      ctx.fillText(`${buf.current[buf.current.length - 1].toFixed(2)} g`, w - 64, 18);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [rider, samplesG]);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-label="Live acceleration trace" />;
}
