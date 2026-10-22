"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { isRtl, translate, type Key, type Lang } from "@/lib/i18n";
import type { EventRecord, RiderState } from "@/lib/schema";
import results from "@/lib/ml/results.json";

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
function emergencyLinks(e: EventRecord, contact?: string) {
  const body = encodeURIComponent(
    `Metrics crash alert. ${e.triage.profile} ${e.triage.mechanism}. Location https://maps.google.com/?q=${e.lat.toFixed(5)},${e.lng.toFixed(5)} Record ${e.id}.`,
  );
  return {
    sms: contact ? `sms:${contact}?&body=${body}` : null,
    call: "tel:999",
  };
}

// Crash alarm for the real rider phone: repeating buzz, the alert spoken once
// in the rider's language, and a short tone. Every browser API is guarded;
// iOS may block sound until the page has had a tap, which is fine.
function startAlarm(lang: Lang): () => void {
  let buzz: number | undefined;
  let ctx: AudioContext | undefined;
  try {
    if ("vibrate" in navigator) {
      const pulse = () => navigator.vibrate([500, 250, 500, 250, 500]);
      pulse();
      buzz = window.setInterval(pulse, 2500);
    }
  } catch {}
  try {
    const synth = window.speechSynthesis;
    if (synth) {
      const want = lang.toLowerCase();
      const voice = synth.getVoices().find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(want));
      // No voice for the language: speak the English line rather than garble it.
      const u = new SpeechSynthesisUtterance(translate(voice || lang === "en" ? lang : "en", "cd.speak"));
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      synth.cancel();
      synth.speak(u);
    }
  } catch {}
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) {
      ctx = new AC();
      const t0 = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, t0 + i * 0.4);
        gain.gain.setValueAtTime(0, t0 + i * 0.4 + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0 + i * 0.4);
        osc.stop(t0 + i * 0.4 + 0.25);
      }
    }
  } catch {}
  return () => {
    try {
      if (buzz !== undefined) window.clearInterval(buzz);
      if ("vibrate" in navigator) navigator.vibrate(0);
    } catch {}
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    try {
      ctx?.close();
    } catch {}
  };
}

const HOLD_MS = 600;

export function PhonePanel({
  rider,
  events,
  onOk,
  onShift,
  live,
  deadlineSec,
  onDeadline,
  emergencyContact,
  skewMs = 0,
  lang = "en",
  alerting = false,
}: {
  rider: RiderState | null;
  events: EventRecord[];
  onOk: () => void;
  onShift?: (on: boolean) => void;
  live?: { peakG: number; status: string } | null;
  deadlineSec?: number | null;
  onDeadline?: (minutes: number | null) => void;
  emergencyContact?: string;
  skewMs?: number;
  lang?: Lang;
  alerting?: boolean;
}) {
  const t = (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const now = useNow() + skewMs;
  const active = events.find((e) => e.status === "detected" && e.cancelDeadline > now);
  const paid = events.find((e) => e.status === "paid");
  const secs = active ? Math.max(0, Math.ceil((active.cancelDeadline - now) / 1000)) : 0;
  const links = (active ?? paid) ? emergencyLinks((active ?? paid)!, emergencyContact) : null;

  // Alarm runs from the start of a countdown until OK or the window closes.
  // The language is read once at the start; changing it mid countdown does
  // not restart the alarm.
  const stopAlarm = useRef<(() => void) | null>(null);
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  const activeId = active?.id;
  useEffect(() => {
    if (!alerting || !activeId) return;
    const stop = startAlarm(langRef.current);
    stopAlarm.current = stop;
    return () => {
      stop();
      stopAlarm.current = null;
    };
  }, [alerting, activeId]);

  // One OK per event, whether it came from the button or a long press.
  const okFor = useRef<string | null>(null);
  const sayOk = () => {
    if (!activeId || okFor.current === activeId) return;
    okFor.current = activeId;
    stopAlarm.current?.();
    onOk();
  };
  // Long press anywhere on the countdown counts as OK, for gloves and rain.
  // Presses that start on a link (999, text) are left alone.
  const hold = useRef<number | null>(null);
  const endHold = () => {
    if (hold.current !== null) window.clearTimeout(hold.current);
    hold.current = null;
  };
  const startHold = (e: { target: EventTarget }) => {
    if ((e.target as HTMLElement).closest("a")) return;
    endHold();
    hold.current = window.setTimeout(sayOk, HOLD_MS);
  };

  return (
    <div className="mx-auto w-full max-w-[300px]" lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"}>
      <div className="rounded-[36px] border border-white/20 bg-[#141414] p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[28px] bg-ink" style={{ aspectRatio: "9 / 18.5" }}>
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="flex h-full flex-col p-5 pt-10">
            <div className="flex items-center justify-between text-xs opacity-60">
              <span>Metrics</span>
              <span className="mono">{timeHK(now)}</span>
            </div>
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key="countdown"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  onPointerDown={startHold}
                  onPointerUp={endHold}
                  onPointerLeave={endHold}
                  onPointerCancel={endHold}
                  onContextMenu={(e) => e.preventDefault()}
                  className="flex flex-1 select-none flex-col items-center text-center [-webkit-touch-callout:none]"
                >
                  <p className="eyebrow mt-1 !opacity-80">{t("cd.eyebrow")}</p>
                  <p className="num mt-1 text-5xl text-peach">{secs}</p>
                  <p className="mt-2 text-xs opacity-80">{t("cd.fine")}</p>
                  <div className="mt-3 grid w-full grid-cols-2 gap-2">
                    <a href={links?.call} className="rounded-full border border-peach/70 py-2.5 text-center text-sm font-medium text-peach">
                      {t("call999")}
                    </a>
                    {links?.sms ? (
                      <a href={links.sms} className="rounded-full border border-white/40 py-2.5 text-center text-sm font-medium">
                        {t("textContact")}
                      </a>
                    ) : (
                      <span className="rounded-full border border-white/15 py-2.5 text-center text-xs opacity-50">{t("noContact")}</span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] opacity-60">{t("cd.silence")}</p>
                  <button
                    onClick={sayOk}
                    className="-mx-5 -mb-5 mt-3 flex min-h-[55%] flex-1 flex-col items-center justify-center self-stretch rounded-t-[24px] bg-paper text-ink active:bg-paper/90"
                  >
                    <span className="text-4xl font-medium">{t("cd.ok")}</span>
                    <span className="mt-2 text-xs opacity-60">{t("cd.hold")}</span>
                  </button>
                </motion.div>
              ) : paid ? (
                <motion.div key="paid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col justify-center">
                  <span className="pill pill-lemon self-start">{t("paid.pill")}</span>
                  <p className="num mt-6 text-5xl" dir="ltr">HK${paid.insurance.payoutHkd.toLocaleString()}</p>
                  <p className="mt-3 text-sm opacity-80">
                    {t("paid.verified", { id: paid.id, time: paid.insurance.paidAt ? timeHK(paid.insurance.paidAt) : "" })}
                  </p>
                  <p className="mt-6 text-xs opacity-60">{t("paid.record", { platform: paid.platform, job: paid.jobId ?? "", time: timeHK(paid.ts) })}</p>
                  <a href={`/r/${paid.id}`} target="_blank" rel="noreferrer" className="mt-3 block w-full rounded-full border border-white/40 py-3 text-center text-sm font-medium">
                    {t("paid.open")}
                  </a>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <a href={links?.call} className="rounded-full border border-peach/70 py-2.5 text-center text-sm text-peach">
                      {t("call999")}
                    </a>
                    {links?.sms && (
                      <a href={links.sms} className="rounded-full border border-white/40 py-2.5 text-center text-sm">
                        {t("textContact")}
                      </a>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="shift" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
                  <div className="mt-6">
                    <p className="eyebrow">{t("shift.label")}</p>
                    <button
                      onClick={() => onShift?.(!rider?.onShift)}
                      disabled={!onShift}
                      className={`mt-3 flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-start transition ${
                        rider?.onShift ? "border-violet bg-violet/20" : "border-white/20"
                      }`}
                    >
                      <span className="text-lg font-medium">{rider?.onShift ? t("shift.on") : t("shift.off")}</span>
                      <span className={`h-3 w-3 rounded-full ${rider?.onShift ? "bg-violet-2" : "bg-white/30"}`} />
                    </button>
                    <p className="mt-2 text-xs opacity-60">{rider?.onShift ? `${rider.platform}, ${rider.jobId ?? ""}` : t("shift.offNote")}</p>
                  </div>
                  {rider?.onShift && onDeadline && (
                    <div className="mt-4">
                      <p className="eyebrow">{t("due.label")}</p>
                      <div className="mt-2 flex gap-2">
                        {[5, 10, 20].map((m) => (
                          <button key={m} onClick={() => onDeadline(m)} className="flex-1 rounded-full border border-white/25 py-2 text-sm">
                            {t("due.min", { m })}
                          </button>
                        ))}
                      </div>
                      {deadlineSec !== null && deadlineSec !== undefined && (
                        <p className={`mono mt-2 text-sm ${deadlineSec < 120 ? "text-peach" : "opacity-70"}`}>
                          {deadlineSec >= 0
                            ? t("due.left", { t: `${Math.floor(deadlineSec / 60)}:${String(deadlineSec % 60).padStart(2, "0")}` })
                            : t("due.late", { s: Math.abs(deadlineSec) })}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] opacity-50">{t("due.note")}</p>
                    </div>
                  )}
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/15 p-3">
                      <p className="text-[11px] opacity-60">{t("heat.label")}</p>
                      <p
                        className={`mt-1 text-sm font-medium ${
                          rider?.heat === "red" ? "text-peach" : rider?.heat === "amber" ? "text-lemon" : "text-paper"
                        }`}
                      >
                        {rider?.heat === "red" ? t("heat.red") : rider?.heat === "amber" ? t("heat.amber") : t("heat.green")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/15 p-3">
                      <p className="text-[11px] opacity-60">{t("fatigue")}</p>
                      <p className="mt-1 text-sm font-medium">{Math.round((rider?.fatigue ?? 0) * 100)}%</p>
                    </div>
                  </div>
                  {live && (
                    <div className="mt-4 rounded-2xl border border-white/15 p-3">
                      <p className="text-[11px] opacity-60">{t("live")}</p>
                      <p className="mono mt-1 text-sm" dir="ltr">{live.peakG.toFixed(2)} g peak, {live.status}</p>
                    </div>
                  )}
                  <p className="mt-auto text-[11px] leading-relaxed opacity-50">{t("privacy")}</p>
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
// Platform safety operations, not the ambulance service. The card follows the
// order the Fire Services Department asks for on a 999 call: what happened,
// exact location, patient condition, callback number.
function mapUrl(e: EventRecord) {
  return `https://maps.google.com/?q=${e.lat.toFixed(5)},${e.lng.toFixed(5)}`;
}

function callScript(e: EventRecord) {
  return [
    e.sample ? "SAMPLE RECORD, not a real rider." : null,
    `Metrics crash alert, record ${e.id}.`,
    `1. What happened: ${e.triage.mechanism}. Peak ${e.peakG} g, travel mode ${e.mode}.`,
    `2. Location: ${e.lat.toFixed(5)}, ${e.lng.toFixed(5)}. ${mapUrl(e)}`,
    `3. Patient: ${e.triage.profile} Still for ${e.stillSec} s after impact. No answer to the phone check inside 30 s.`,
    `4. Callback: the rider's phone. The number is not shared with operations.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function apps(e: EventRecord) {
  const jobs = e.activeJobs?.length ? e.activeJobs : [{ platform: e.platform, jobId: e.jobId ?? "no job" }];
  return jobs.map((j) => `${j.platform}, ${j.jobId}`).join("; ");
}

function sourcesText(e: EventRecord) {
  const s = e.sources ?? [];
  if (s.length > 1) return `${s.join(" and ")} agreed`;
  return s.length ? `${s[0]} only` : "not recorded";
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[22px_1fr] gap-2 border-t border-current/10 pt-2">
      <span className="mono text-xs opacity-50">{n}</span>
      <div>
        <p className="text-[11px] uppercase tracking-wider opacity-60">{label}</p>
        <div className="mt-0.5 text-sm">{children}</div>
      </div>
    </div>
  );
}

export function DispatcherPanel({ events }: { events: EventRecord[] }) {
  const now = useNow(1000);
  const [copied, setCopied] = useState<{ id: string; ok: boolean } | null>(null);
  const visible = events.filter((e) => e.status !== "cancelled" && (e.status !== "detected" || e.cancelDeadline <= now));
  const pending = events.find((e) => e.status === "detected" && e.cancelDeadline > now);
  const copy = async (e: EventRecord) => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(callScript(e));
      setCopied({ id: e.id, ok: true });
    } catch {
      setCopied({ id: e.id, ok: false });
    }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow whitespace-nowrap">Dispatcher</p>
        <span className="mono whitespace-nowrap text-xs opacity-50">{timeHK(now)}</span>
      </div>
      <p className="mt-2 text-sm opacity-70">For platform safety operations. You call 999 for the rider. Each card reads in the order the call taker asks.</p>
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
              className={`rounded-2xl border p-4 ${e.sample ? "border-current/25 bg-current/5" : "border-peach/60 bg-peach/10"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {e.sample ? <span className="pill pill-outline">Sample</span> : <span className="pill pill-peach">Alert</span>}
                  <span className="mono text-xs opacity-70">{timeHK(e.ts)}</span>
                </div>
                <button
                  onClick={() => copy(e)}
                  className="rounded-full border border-current/40 px-3 py-1.5 text-xs font-medium transition hover:bg-ink hover:text-paper"
                >
                  {copied?.id === e.id ? (copied.ok ? "Copied" : "Copy failed, select the text") : "Copy for 999"}
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <Step n={1} label="What happened">
                  {e.triage.mechanism}. Peak {e.peakG} g, travel mode {e.mode}.
                </Step>
                <Step n={2} label="Exact location">
                  <span className="mono">
                    {e.lat.toFixed(5)}, {e.lng.toFixed(5)}
                  </span>{" "}
                  <a href={mapUrl(e)} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    Open map
                  </a>
                </Step>
                <Step n={3} label="Patient">
                  <span className="font-medium">{e.triage.profile}</span> Still for {e.stillSec} s. No answer inside 30 s.
                </Step>
                <Step n={4} label="Callback">
                  Rider&apos;s phone. The number is not shared with operations.
                </Step>
              </div>
              <p className="mt-3 text-xs opacity-60">
                Sensors: {sourcesText(e)}. Open orders: {apps(e)}. Rider {e.riderId}.
              </p>
              {e.sample && <p className="mt-1 text-xs opacity-60">Sample record so this screen is not blank. Not a real rider. Do not call.</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* Underwriter */
// Basis risk from the shipped model at the 0.5 threshold, read from results.json.
const SWEEP_AT_HALF = results.threshold_sweep_gbm.find((r) => r.threshold === 0.5)!;

// Settlement signatures are checked server side; the client asks /api/verify
// once per settled event.
function useSettlementChecks(events: EventRecord[]) {
  const [checks, setChecks] = useState<Record<string, boolean | null>>({});
  const todo = events.filter((e) => e.settlement && e.signature && !(e.id in checks));
  const key = todo.map((e) => e.id).join(",");
  useEffect(() => {
    if (!key) return;
    let live = true;
    Promise.all(
      todo.map((e) =>
        fetch("/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(e) })
          .then((r) => r.json())
          .then((j: { settlementValid: boolean | null }) => [e.id, j.settlementValid] as const)
          .catch(() => [e.id, null] as const),
      ),
    ).then((pairs) => live && setChecks((c) => ({ ...c, ...Object.fromEntries(pairs) })));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return checks;
}

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
  const checks = useSettlementChecks(events);
  const paidTotal = events.filter((e) => e.status === "paid").reduce((s, e) => s + e.insurance.payoutHkd, 0);
  const tierOne = events.find((e) => e.insurance.payoutHkd > 0)?.insurance.payoutHkd ?? null;
  const settled = events.filter((e) => e.settlement);
  const verified = settled.filter((e) => checks[e.id] === true).length;
  const { fp, tn, fn, tp } = SWEEP_AT_HALF;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow whitespace-nowrap">Underwriter</p>
        <span className="mono whitespace-nowrap text-xs opacity-50">{timeHK(now)}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/25 p-3">
          <p className="text-[11px] opacity-70">Premium per window</p>
          <p className="num mt-1 text-2xl">HK${premium.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-black/25 p-3">
          <p className="text-[11px] opacity-70">Paid out</p>
          <p className="num mt-1 text-2xl">HK${paidTotal.toLocaleString()}</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-black/25 p-3 sm:col-span-1">
          <p className="text-[11px] opacity-70">Exposure</p>
          <p className="mt-1 text-sm font-medium capitalize">
            {rider?.rain ? "Rain" : "Dry"}, {rider?.heat ?? "green"}, fatigue {Math.round((rider?.fatigue ?? 0) * 100)}%
          </p>
        </div>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-black/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] opacity-70">Tier one, fixed payout</p>
            <span className="pill pill-lemon !py-0.5 !text-[10px]">Live</span>
          </div>
          <p className="num mt-1 text-2xl">{tierOne === null ? "No event yet" : `HK$${tierOne.toLocaleString()}`}</p>
          <p className="mt-1 text-xs opacity-70">
            Paid when the 30 s cancel window closes. The outcome is signed. {verified} of {settled.length} settlement signatures verified.
          </p>
        </div>
        <div className="rounded-2xl border border-white/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] opacity-70">Tier two, statutory amounts</p>
            <span className="pill pill-outline !py-0.5 !text-[10px]">Not built</span>
          </div>
          <p className="mt-1 text-sm font-medium">Unlocked by a hospital discharge record.</p>
          <p className="mt-1 text-xs opacity-70">Sick leave, medical costs and incapacity under the proposed regime. Not built yet.</p>
        </div>
      </div>
      <div className="scroll-thin mt-4 flex-1 overflow-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider opacity-60">
            <tr>
              <th className="pb-2 font-medium">Event</th>
              <th className="pb-2 font-medium">Liable, share of tier one</th>
              <th className="pb-2 font-medium">Sensors</th>
              <th className="pb-2 font-medium">Conf.</th>
              <th className="pb-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 opacity-50">
                    No events. Premium is accruing per window.
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-current/10 align-top">
                  <td className="py-3 pr-2">
                    <a href={`/r/${e.id}`} target="_blank" rel="noreferrer" className="mono text-xs underline-offset-2 hover:underline">
                      {e.id}
                    </a>
                    {e.sample && <span className="pill pill-outline ml-2 !py-0.5 !text-[10px]">Sample</span>}
                    <p className="text-xs opacity-60">{timeHK(e.ts)}</p>
                    {e.deadlineSec !== null && <p className="text-[11px] opacity-60">{e.deadlineSec >= 0 ? `${Math.round(e.deadlineSec / 60)} min to deadline` : "already late"}</p>}
                  </td>
                  <td className="py-3 pr-2">
                    {(e.apportionment?.length ? e.apportionment : [{ platform: e.platform, share: 1 }]).map((a) => (
                      <p key={a.platform}>
                        <span className="font-medium">{a.platform}</span>{" "}
                        <span className="text-xs opacity-70">
                          {Math.round(a.share * 100)}%, HK${Math.round(a.share * e.insurance.payoutHkd).toLocaleString()}
                        </span>
                      </p>
                    ))}
                    <p className="text-xs opacity-60">{(e.activeJobs ?? []).map((j) => j.jobId).join(", ") || e.jobId}</p>
                  </td>
                  <td className="py-3 pr-2 text-xs capitalize">{(e.sources ?? []).join(" + ") || "none"}</td>
                  <td className="py-3 pr-2 mono text-xs">{Math.round(e.confidence * 100)}%</td>
                  <td className="py-3 text-right">
                    <StatusPill s={e.status} />
                    {e.status === "paid" && <p className="mt-1 text-xs opacity-60">HK${e.insurance.payoutHkd.toLocaleString()}</p>}
                    {e.settlement && (
                      <p className="mt-1 text-[11px] opacity-70">
                        {checks[e.id] === true ? "Settlement verified" : checks[e.id] === false ? "Settlement altered" : "Checking"}
                      </p>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-2xl border border-white/20 p-3 text-xs leading-relaxed">
        <p className="eyebrow !opacity-70">Basis risk at threshold 0.5</p>
        <p className="mt-1 opacity-85">
          On {results.n_trials} UMAFall recordings, tested leave-subjects-out, the model raised {fp} false alarms in {fp + tn} non-falls and missed {fn} of {fn + tp} falls. Each false alarm the
          rider does not cancel pays {tierOne === null ? "the tier one amount" : `HK$${tierOne.toLocaleString()}`} that should not be paid. Each
          miss is a payout that never happens.
        </p>
        <p className="mt-2 opacity-60">Split rule is a placeholder: equal shares across every app with an open order. All money is an illustrative placeholder.</p>
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
    <ol className="flex items-center gap-2 whitespace-nowrap md:flex-wrap">
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
