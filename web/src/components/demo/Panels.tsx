"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { EventRecord, RiderState } from "@/lib/schema";

function timeHK(ts: number) {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Hong_Kong" });
}

export function useNow(ms = 250) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function StatusPill({ s }: { s: EventRecord["status"] }) {
  const map: Record<EventRecord["status"], string> = {
    detected: "pill-peach",
    cancelled: "pill-outline",
    confirmed: "pill-violet",
    paid: "pill-lemon",
  };
  const label: Record<EventRecord["status"], string> = {
    detected: "30 s window",
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    paid: "Paid",
  };
  return <span className={`pill ${map[s]}`}>{label[s]}</span>;
}

/* Rider phone */
export function PhonePanel({
  rider,
  events,
  onOk,
  onShift,
  live,
}: {
  rider: RiderState | null;
  events: EventRecord[];
  onOk: () => void;
  onShift?: (on: boolean) => void;
  live?: { peakG: number; status: string } | null;
}) {
  const now = useNow();
  const active = events.find((e) => e.status === "detected" && e.cancelDeadline > now);
  const paid = events.find((e) => e.status === "paid");
  const secs = active ? Math.max(0, Math.ceil((active.cancelDeadline - now) / 1000)) : 0;
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[36px] border border-white/20 bg-[#141414] p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[28px] bg-ink" style={{ aspectRatio: "9 / 18.5" }}>
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="flex h-full flex-col p-5 pt-10">
            <div className="flex items-center justify-between text-xs opacity-60">
              <span>MetricsFile</span>
              <span className="mono">{timeHK(now)}</span>
            </div>
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key="countdown"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-1 flex-col items-center justify-center text-center"
                >
                  <p className="eyebrow !opacity-80">Impact detected</p>
                  <p className="num mt-4 text-7xl text-peach">{secs}</p>
                  <p className="mt-3 text-sm opacity-80">If you are fine, tap below. Nothing leaves your phone.</p>
                  <button onClick={onOk} className="mt-8 w-full rounded-full bg-paper py-4 text-lg font-medium text-ink active:scale-[0.98]">
                    I&apos;m OK
                  </button>
                  <p className="mt-4 text-xs opacity-60">Silence sends your location and a triage note to dispatch.</p>
                </motion.div>
              ) : paid ? (
                <motion.div key="paid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col justify-center">
                  <span className="pill pill-lemon self-start">Paid</span>
                  <p className="num mt-6 text-5xl">HK${paid.insurance.payoutHkd.toLocaleString()}</p>
                  <p className="mt-3 text-sm opacity-80">Verified event {paid.id}. Paid at {paid.insurance.paidAt ? timeHK(paid.insurance.paidAt) : ""}.</p>
                  <p className="mt-6 text-xs opacity-60">Your record: {paid.platform}, {paid.jobId}, {timeHK(paid.ts)}. You own this. Share it if you need it.</p>
                </motion.div>
              ) : (
                <motion.div key="shift" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
                  <div className="mt-6">
                    <p className="eyebrow">Shift</p>
                    <button
                      onClick={() => onShift?.(!rider?.onShift)}
                      disabled={!onShift}
                      className={`mt-3 flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                        rider?.onShift ? "border-violet bg-violet/20" : "border-white/20"
                      }`}
                    >
                      <span className="text-lg font-medium">{rider?.onShift ? "On shift" : "Off shift"}</span>
                      <span className={`h-3 w-3 rounded-full ${rider?.onShift ? "bg-violet-2" : "bg-white/30"}`} />
                    </button>
                    <p className="mt-2 text-xs opacity-60">{rider?.onShift ? `${rider.platform}, ${rider.jobId ?? ""}` : "Nothing is recorded off shift."}</p>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/15 p-3">
                      <p className="text-[11px] opacity-60">Heat</p>
                      <p
                        className={`mt-1 text-sm font-medium ${
                          rider?.heat === "red" ? "text-peach" : rider?.heat === "amber" ? "text-lemon" : "text-paper"
                        }`}
                      >
                        {rider?.heat === "red" ? "Red. Rest now." : rider?.heat === "amber" ? "Amber. Drink, slow down." : "Green"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/15 p-3">
                      <p className="text-[11px] opacity-60">Fatigue</p>
                      <p className="mt-1 text-sm font-medium">{Math.round((rider?.fatigue ?? 0) * 100)}%</p>
                    </div>
                  </div>
                  {live && (
                    <div className="mt-4 rounded-2xl border border-white/15 p-3">
                      <p className="text-[11px] opacity-60">Live sensor</p>
                      <p className="mono mt-1 text-sm">{live.peakG.toFixed(2)} g peak, {live.status}</p>
                    </div>
                  )}
                  <p className="mt-auto text-[11px] leading-relaxed opacity-50">
                    Alerts are shown to you only. Your platform never sees heat, fatigue, route or speed.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Dispatcher */
export function DispatcherPanel({ events }: { events: EventRecord[] }) {
  const now = useNow(1000);
  const visible = events.filter((e) => e.status !== "cancelled" && (e.status !== "detected" || e.cancelDeadline <= now));
  const pending = events.find((e) => e.status === "detected" && e.cancelDeadline > now);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Dispatcher</p>
        <span className="mono text-xs opacity-50">{timeHK(now)} HKT</span>
      </div>
      {pending && (
        <p className="mt-3 text-xs opacity-60">
          Impact detected. Waiting {Math.max(0, Math.ceil((pending.cancelDeadline - now) / 1000))} s for the rider to respond before alerting.
        </p>
      )}
      <div className="scroll-thin mt-4 flex-1 space-y-3 overflow-auto">
        <AnimatePresence initial={false}>
          {visible.length === 0 && !pending && <p className="text-sm opacity-50">No alerts. Riders on shift are moving.</p>}
          {visible.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-peach/60 bg-peach/10 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="pill pill-peach">Alert</span>
                <span className="mono text-xs opacity-70">{timeHK(e.ts)}</span>
              </div>
              <p className="mt-3 text-lg font-medium leading-snug">{e.triage.profile}</p>
              <p className="mt-1 text-sm opacity-80">{e.triage.mechanism}. Peak {e.peakG} g, tilt {e.tiltDeg} deg, still {e.stillSec} s.</p>
              <p className="mono mt-3 text-xs opacity-70">
                {e.lat.toFixed(5)}, {e.lng.toFixed(5)}
              </p>
              <p className="mt-1 text-xs opacity-60">Rider {e.riderId}. No answer inside 30 s.</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* Underwriter */
export function UnderwriterPanel({
  rider,
  events,
  premium,
}: {
  rider: RiderState | null;
  events: EventRecord[];
  premium: number;
}) {
  const now = useNow(1000);
  const paidTotal = events.filter((e) => e.status === "paid").reduce((s, e) => s + e.insurance.payoutHkd, 0);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Underwriter</p>
        <span className="mono text-xs opacity-50">{timeHK(now)} HKT</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="text-[11px] opacity-60">Premium, 20 min window</p>
          <p className="num mt-1 text-2xl">HK${premium.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="text-[11px] opacity-60">Exposure</p>
          <p className="mt-1 text-sm font-medium">
            {rider?.rain ? "Rain" : "Dry"}, {rider?.heat ?? "green"}, fatigue {Math.round((rider?.fatigue ?? 0) * 100)}%
          </p>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="text-[11px] opacity-60">Paid out</p>
          <p className="num mt-1 text-2xl">HK${paidTotal.toLocaleString()}</p>
        </div>
      </div>
      <div className="scroll-thin mt-4 flex-1 overflow-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider opacity-60">
            <tr>
              <th className="pb-2 font-medium">Event</th>
              <th className="pb-2 font-medium">Liable</th>
              <th className="pb-2 font-medium">Conf.</th>
              <th className="pb-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 opacity-50">
                    No events. Premium is accruing per window.
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-current/10 align-top">
                  <td className="py-3 pr-2">
                    <p className="mono text-xs">{e.id}</p>
                    <p className="text-xs opacity-60">{timeHK(e.ts)}</p>
                  </td>
                  <td className="py-3 pr-2">
                    <p className="font-medium">{e.platform}</p>
                    <p className="text-xs opacity-60">{e.jobId}</p>
                  </td>
                  <td className="py-3 pr-2 mono text-xs">{Math.round(e.confidence * 100)}%</td>
                  <td className="py-3 text-right">
                    <StatusPill s={e.status} />
                    {e.status === "paid" && <p className="mt-1 text-xs opacity-60">HK${e.insurance.payoutHkd.toLocaleString()}</p>}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Pipeline status strip */
export function PipelineStatus({ events, rider }: { events: EventRecord[]; rider: RiderState | null }) {
  const now = useNow(500);
  const latest = events[0];
  const stage = !rider?.onShift
    ? 0
    : !latest
      ? 1
      : latest.status === "cancelled"
        ? 1
        : latest.status === "detected" && latest.cancelDeadline > now
          ? 3
          : latest.status === "paid"
            ? 6
            : 5;
  const steps = ["Off shift", "Riding", "Impact", "30 s window", "Triage", "Record", "Paid"];
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const done = i < stage || (stage === 6 && i === 6);
        const cur = i === stage;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`pill transition ${cur ? "pill-paper" : done ? "pill-violet" : "pill-outline opacity-50"}`}
              aria-current={cur}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="h-px w-3 bg-white/30" />}
          </li>
        );
      })}
    </ol>
  );
}
