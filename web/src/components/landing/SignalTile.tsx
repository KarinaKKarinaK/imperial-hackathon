"use client";

import { useEffect, useRef, useState } from "react";

// A live acceleration trace. Hover or tap to drop the helmet and watch the
// three signals appear: impact, fall, stillness.
export function SignalTile({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const buf = useRef<number[]>(new Array(200).fill(1));
  const crashAt = useRef<number | null>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"riding" | "impact" | "fall" | "still">("riding");

  const drop = () => {
    if (crashAt.current && performance.now() - crashAt.current < 4000) return;
    crashAt.current = performance.now();
  };

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
      const since = crashAt.current ? (performance.now() - crashAt.current) / 1000 : null;
      let next: number;
      let s: typeof state = "riding";
      if (since !== null && since < 0.5) {
        next = 1 + 13 * Math.exp(-((since - 0.1) ** 2) / 0.003);
        s = "impact";
      } else if (since !== null && since < 1.6) {
        next = 1 + Math.sin(since * 22) * 0.8 * Math.exp(-(since - 0.5) * 3);
        s = "fall";
      } else if (since !== null && since < 4) {
        next = 1 + (Math.random() - 0.5) * 0.02;
        s = "still";
      } else {
        if (since !== null) crashAt.current = null;
        next = 1 + (Math.random() - 0.5) * 0.3 + Math.sin(t / 6) * 0.08;
      }
      setState((p) => (p === s ? p : s));
      buf.current.push(next);
      if (readout.current) readout.current.textContent = `${next.toFixed(1)} g`; // written by the draw loop, not by render
      if (buf.current.length > 200) buf.current.shift();
      t++;
      const y = (g: number) => h - 14 - (Math.min(15, g) / 15) * (h - 28);
      ctx.strokeStyle = "rgba(243,243,240,0.25)";
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(0, y(6));
      ctx.lineTo(w, y(6));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = s === "riding" ? "#f3f3f0" : "#f0a070";
      ctx.beginPath();
      buf.current.forEach((g, i) => {
        const x = (i / 199) * w;
        if (i === 0) ctx.moveTo(x, y(g));
        else ctx.lineTo(x, y(g));
      });
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const label = { riding: "Riding. Tap to drop.", impact: "Impact", fall: "Fall", still: "Stillness. Event." }[state];

  return (
    <button
      onMouseEnter={drop}
      onClick={drop}
      className={`group relative block w-full cursor-pointer text-left ${className}`}
      aria-label="Simulate a helmet drop"
    >
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <span className="absolute left-5 top-5 flex items-center gap-2 text-xs">
        <span className={`h-2 w-2 rounded-full ${state === "riding" ? "bg-paper" : "bg-peach"}`} />
        <span className="opacity-80">{label}</span>
      </span>
      <span ref={readout} className="mono absolute bottom-4 right-5 text-xs opacity-50">1.0 g</span>
    </button>
  );
}
