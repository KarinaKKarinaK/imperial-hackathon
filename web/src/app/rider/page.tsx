"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/Arrow";
import { PhonePanel } from "@/components/demo/Panels";
import { SensorTrace } from "@/components/demo/SensorTrace";
import { detectCrash, THRESHOLDS } from "@/lib/detector";
import { connectHelmet, helmetSupported, type HelmetHandle } from "@/lib/helmet";
import { isRtl, LANGS, needsReview, useLang, type Lang } from "@/lib/i18n";
import type { Sample } from "@/lib/schema";
import { useSnapshot } from "@/lib/useSnapshot";

// The phone is the sensor. DeviceMotion samples are buffered for 6 seconds
// and posted to the server, which runs the same detector as the demo. With the
// helmet paired, the helmet window is primary and the phone window goes along
// so the server can check both felt the impact.

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

// A random key made once on this phone. The first write claims the rider id
// with it; nobody else can write to or cancel for this rider.
function riderKeyFor(): string {
  const make = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  try {
    const k = "mf-rider-key";
    let v = localStorage.getItem(k);
    if (!v) {
      v = make();
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return make();
  }
}

// Four buttons, each label in its own script. The ne and ur strings are drafts,
// so the note under the picker says so in English.
function LangPicker({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {LANGS.map((l) => (
          <button
            key={l.code}
            lang={l.code}
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            className={`rounded-full border px-3 py-1 text-xs ${lang === l.code ? "border-violet bg-violet/20" : "border-current/20 opacity-70"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {needsReview(lang) && (
        <p lang="en" dir="ltr" className="mt-1 text-[11px] opacity-60">
          Translation pending a native speaker check.
        </p>
      )}
    </div>
  );
}

const WINDOW_MS = 6000;
const recent = (buf: Sample[]) => buf.filter((s) => Date.now() - s.t < WINDOW_MS);

export default function RiderPage() {
  const [riderId, setRiderId] = useState("rider-demo");
  const [riderKey, setRiderKey] = useState<string | undefined>(undefined);
  const [consented, setConsented] = useState(false);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");
  const [samplesG, setSamplesG] = useState<number[]>([]);
  const [live, setLive] = useState<{ peakG: number; status: string } | null>(null);
  const [helmet, setHelmet] = useState<HelmetHandle | null>(null);
  const [helmetHz, setHelmetHz] = useState(0);
  const helmetCount = useRef(0);
  const phoneBuf = useRef<Sample[]>([]);
  const helmetBuf = useRef<Sample[]>([]);
  const pos = useRef<{ lat: number; lng: number; speedKmh?: number } | undefined>(undefined);
  const { snap, refresh, skewMs } = useSnapshot(riderId, 1000, riderKey);
  const { lang, setLang, t } = useLang();
  const [tooLate, setTooLate] = useState(false);
  const headers = useCallback(() => ({ "content-type": "application/json", "x-rider-key": riderKey ?? "" }), [riderKey]);

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
    setRiderKey(riderKeyFor());
    try {
      setConsented(localStorage.getItem("mf-consent") === "1");
    } catch {}
  }, []);

  const onMotion = useCallback((e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null || a.y === null || a.z === null) return;
    const s: Sample = { t: Date.now(), ax: a.x, ay: a.y, az: a.z };
    phoneBuf.current.push(s);
    if (phoneBuf.current.length > 1200) phoneBuf.current.splice(0, phoneBuf.current.length - 1200);
    if (helmetRef.current) return; // the trace shows the helmet while it is paired
    const g = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.81;
    setSamplesG((prev) => {
      const next = prev.length > 240 ? prev.slice(-240) : prev.slice();
      next.push(g);
      return next;
    });
  }, []);

  const pushSamples = useCallback((arr: Sample[]) => {
    for (const s of arr) {
      helmetBuf.current.push(s);
      const g = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az) / 9.81;
      setSamplesG((prev) => {
        const next = prev.length > 240 ? prev.slice(-240) : prev.slice();
        next.push(g);
        return next;
      });
    }
    if (helmetBuf.current.length > 1200) helmetBuf.current.splice(0, helmetBuf.current.length - 1200);
    helmetCount.current += arr.length;
  }, []);

  const helmetRef = useRef<HelmetHandle | null>(null);
  useEffect(() => {
    helmetRef.current = helmet;
    if (!helmet) return;
    const id = setInterval(() => {
      setHelmetHz(helmetCount.current);
      helmetCount.current = 0;
    }, 1000);
    return () => clearInterval(id);
  }, [helmet]);

  const pairHelmet = useCallback(async () => {
    try {
      const h = await connectHelmet(pushSamples, undefined, () => setHelmet(null));
      setHelmet(h);
      setPermission("granted");
    } catch {}
  }, [pushSamples]);

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
      // Helmet window first when paired, phone window alongside for the
      // two-sensor check. Full rate, no decimation, so peaks are not flattened.
      const helmetWin = helmetRef.current ? recent(helmetBuf.current) : [];
      const phoneWin = recent(phoneBuf.current);
      const useHelmet = helmetWin.length >= 10;
      const win = useHelmet ? helmetWin : phoneWin;
      if (win.length < 10 || win[win.length - 1].t - win[0].t < 500) return;
      const d = detectCrash(win);
      setLive({ peakG: d.stats.peakG, status: d.isCrash ? `crash, p=${d.confidence.toFixed(2)}` : d.stats.peakG > THRESHOLDS.impactG ? `impact, p=${d.confidence.toFixed(2)}` : `normal, p=${d.confidence.toFixed(2)}` });
      if (!snap?.rider.onShift) return;
      try {
        const phoneOk = useHelmet && phoneWin.length >= 10 && phoneWin[phoneWin.length - 1].t - phoneWin[0].t >= 500;
        await fetch("/api/telemetry", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            riderId,
            samples: win,
            source: useHelmet ? "helmet" : "phone",
            phoneSamples: phoneOk ? phoneWin : undefined,
            pos: pos.current,
          }),
        });
        if (d.isCrash) refresh();
      } catch {}
    }, 1500);
    return () => clearInterval(id);
  }, [permission, riderId, snap?.rider.onShift, refresh, headers]);

  const [contact, setContact] = useState("");
  useEffect(() => {
    try {
      setContact(localStorage.getItem("mf-contact") ?? "");
    } catch {}
  }, []);
  const saveContact = async (v: string) => {
    setContact(v);
    try {
      localStorage.setItem("mf-contact", v);
    } catch {}
    await fetch("/api/rider", { method: "POST", headers: headers(), body: JSON.stringify({ riderId, emergencyContact: v || null }) });
  };
  const setDeadline = async (minutes: number | null) => {
    await fetch("/api/rider", { method: "POST", headers: headers(), body: JSON.stringify({ riderId, deadlineMinutes: minutes }) });
    refresh();
  };

  const setShift = async (on: boolean) => {
    await fetch("/api/shift", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ riderId, onShift: on, platform: "Platform A" }),
    });
    refresh();
  };

  const ok = async () => {
    const e = snap?.events.find((x) => x.status === "detected");
    if (!e) return;
    try {
      const r = await fetch(`/api/events/${e.id}/cancel`, { method: "POST", headers: headers() });
      // 409 means the window closed before the tap reached the server.
      if (r.status === 409) {
        setTooLate(true);
        setTimeout(() => setTooLate(false), 10000);
      }
    } catch {}
    refresh();
  };

  const consent = () => {
    try {
      localStorage.setItem("mf-consent", "1");
    } catch {}
    setConsented(true);
  };

  return (
    <main lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"} className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm opacity-70">
          Metrics
        </Link>
        <span className="mono text-xs opacity-50" dir="ltr">
          {riderId}
        </span>
      </div>
      {consented && (
        <div className="mt-3">
          <LangPicker lang={lang} setLang={setLang} />
        </div>
      )}

      {!consented ? (
        <section className="tile tile-paper mt-4 p-6">
          <LangPicker lang={lang} setLang={setLang} />
          <p className="eyebrow mt-5">{t("consent.eyebrow")}</p>
          <h1 className="display mt-3 text-3xl">{t("consent.title")}</h1>
          <ul className="mt-5 space-y-3 text-[15px] leading-relaxed">
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              {t("consent.b1")}
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              {t("consent.b2")}
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              {t("consent.b3")}
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" />
              {t("consent.b4")}
            </li>
          </ul>
          <button onClick={consent} className="mt-6 w-full rounded-full bg-ink py-4 text-lg font-medium text-paper">
            {t("consent.cta")}
          </button>
          <p className="mt-3 text-xs opacity-60">{t("consent.note")}</p>
        </section>
      ) : (
        <>
          <section className="mt-4">
            {permission !== "granted" ? (
              <div className="tile tile-dusk tile-grain p-6">
                <p className="eyebrow !opacity-80">{t("motion.step")}</p>
                <h1 className="display mt-2 text-3xl">{t("motion.title")}</h1>
                <p className="mt-3 text-[15px] opacity-90">{t("motion.body")}</p>
                <button onClick={enableMotion} className="mt-5 w-full rounded-full bg-paper py-4 text-lg font-medium text-ink">
                  {t("motion.allow")}
                </button>
                {helmetSupported() && (
                  <button onClick={pairHelmet} className="mt-3 w-full rounded-full border border-white/60 py-3.5 text-base font-medium">
                    {t("motion.pairInstead")}
                  </button>
                )}
                {permission === "denied" && <p className="mt-3 text-sm">{t("motion.denied")}</p>}
                {permission === "unsupported" && <p className="mt-3 text-sm">{t("motion.unsupported")}</p>}
              </div>
            ) : (
              <div className="tile tile-ink relative h-40 p-4">
                <SensorTrace rider={snap?.rider ?? null} events={snap?.events ?? []} samplesG={samplesG} />
                <span className="pill pill-outline absolute left-3 top-3 !py-1 !text-[11px]">
                  {helmet ? `${helmet.name}, ${helmetHz} Hz` : t("sensor.phone")}
                </span>
                {!helmet && helmetSupported() && (
                  <button onClick={pairHelmet} className="absolute right-3 top-3 rounded-full border border-white/40 px-3 py-1 text-[11px]">
                    {t("sensor.pair")}
                  </button>
                )}
              </div>
            )}
          </section>
          <section className="mt-4">
            <PhonePanel
              rider={snap?.rider ?? null}
              events={snap?.events ?? []}
              onOk={ok}
              onShift={setShift}
              live={live}
              deadlineSec={snap?.deadlineSec ?? null}
              onDeadline={setDeadline}
              emergencyContact={contact}
              skewMs={skewMs}
              lang={lang}
              alerting
            />
            {tooLate && (
              <p role="alert" className="mt-3 rounded-2xl border border-peach/60 px-4 py-3 text-center text-sm text-peach">
                {t("cancel.tooLate")}
              </p>
            )}
          </section>
          <section className="tile tile-night mt-4 p-5">
            <p className="eyebrow">{t("contact.title")}</p>
            <p className="mt-2 text-xs opacity-60">{t("contact.body")}</p>
            <input
              type="tel"
              inputMode="tel"
              value={contact}
              onChange={(e) => saveContact(e.target.value)}
              placeholder="+852 ..."
              dir="ltr"
              className="mt-3 w-full rounded-full border border-white/20 bg-transparent px-4 py-3 text-base outline-none focus:border-violet"
            />
          </section>
          <p className="mt-6 text-center text-xs opacity-50">
            {t("footer.see")}:{" "}
            <Link href="/demo" className="underline">
              {t("footer.demo")}
            </Link>
            ,{" "}
            <Link href="/dispatch" className="underline">
              {t("footer.dispatch")}
            </Link>
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem("mf-consent");
              } catch {}
              setConsented(false);
              window.removeEventListener("devicemotion", onMotion);
              setPermission("idle");
              phoneBuf.current = [];
              helmetBuf.current = [];
            }}
            className="arrow-link mx-auto mt-6 block text-sm opacity-70"
          >
            {t("withdraw")} <Arrow size={14} />
          </button>
        </>
      )}
    </main>
  );
}
