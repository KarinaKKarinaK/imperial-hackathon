"use client";

import { Map as MlMap, Marker, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { EventRecord, RiderState } from "@/lib/schema";

const STYLE = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  rider: RiderState | null;
  route: [number, number][];
  events: EventRecord[];
  others?: RiderState[];
  className?: string;
  compact?: boolean;
};

// 3D map of Kowloon with extruded buildings, the delivery loop, the rider, and
// a pulse where the crash happened.
export function MapScene({ rider, route, events, others = [], className = "", compact = false }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const riderEl = useRef<HTMLDivElement | null>(null);
  const riderMarker = useRef<Marker | null>(null);
  const crashMarker = useRef<Marker | null>(null);
  const otherMarkers = useRef<Map<string, Marker>>(new Map());
  const ready = useRef(false);

  useEffect(() => {
    if (!el.current || map.current) return;
    // The bundler cannot serve MapLibre's module worker, so it is copied to
    // public/ at build time and loaded from there.
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const m = new MlMap({
      container: el.current,
      style: STYLE,
      center: [114.1725, 22.321],
      zoom: compact ? 14.6 : 15.3,
      pitch: compact ? 50 : 62,
      bearing: -20,
      canvasContextAttributes: { antialias: true },
      attributionControl: { compact: true },
      cooperativeGestures: compact,
    });
    map.current = m;
    (window as unknown as { __mfMap?: MlMap }).__mfMap = m;
    m.on("load", () => {
      // Dark treatment on top of the vector style.
      const layers = m.getStyle().layers ?? [];
      for (const l of layers) {
        if (l.type === "symbol" && !l.id.includes("road") && !l.id.includes("place")) {
          m.setLayoutProperty(l.id, "visibility", "none");
        }
      }
      try {
        m.setPaintProperty("background", "background-color", "#0d0d0d");
      } catch {}
      for (const l of layers) {
        if (l.type === "fill" && /landuse|landcover|park|building|residential/.test(l.id)) {
          try {
            m.setPaintProperty(l.id, "fill-color", "#161616");
          } catch {}
        }
        if (l.type === "fill" && /water/.test(l.id)) {
          try {
            m.setPaintProperty(l.id, "fill-color", "#0a0a0a");
          } catch {}
        }
        if (l.type === "line" && /road|street|highway|bridge|tunnel|path|transportation/.test(l.id)) {
          try {
            m.setPaintProperty(l.id, "line-color", "#3a3a3a");
          } catch {}
        }
      }
      m.addLayer({
        id: "mf-buildings",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 10], 0, "#1f1f1f", 80, "#3b3b3b", 200, "#5a5a5a"],
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 10],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.92,
        },
      });
      m.addSource("mf-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } } });
      m.addLayer({
        id: "mf-route-glow",
        type: "line",
        source: "mf-route",
        paint: { "line-color": "#6b4cff", "line-width": 10, "line-opacity": 0.25, "line-blur": 6 },
      });
      m.addLayer({
        id: "mf-route",
        type: "line",
        source: "mf-route",
        paint: { "line-color": "#8f7bff", "line-width": 3 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      ready.current = true;

      const rEl = document.createElement("div");
      rEl.className = "mf-rider";
      rEl.innerHTML = `<span></span>`;
      riderEl.current = rEl;
      riderMarker.current = new Marker({ element: rEl }).setLngLat(route[0]).addTo(m);
    });
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      ready.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rider position
  useEffect(() => {
    if (!rider || !riderMarker.current) return;
    riderMarker.current.setLngLat([rider.lng, rider.lat]);
    const crashed = events.some((e) => e.riderId === rider.riderId && e.status !== "cancelled" && Date.now() - e.ts < 120_000);
    riderEl.current?.classList.toggle("down", crashed);
    riderEl.current?.classList.toggle("off", !rider.onShift);
  }, [rider, events]);

  // Other riders: real phones that are on shift right now
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    const seen = new Set<string>();
    for (const o of others) {
      if (!o.onShift) continue;
      seen.add(o.riderId);
      let mk = otherMarkers.current.get(o.riderId);
      if (!mk) {
        const el = document.createElement("div");
        el.className = "mf-other";
        el.innerHTML = `<i></i><b>${o.riderId.replace("rider-", "")}</b>`;
        mk = new Marker({ element: el }).setLngLat([o.lng, o.lat]).addTo(m);
        otherMarkers.current.set(o.riderId, mk);
      } else {
        mk.setLngLat([o.lng, o.lat]);
      }
      const down = events.some((e) => e.riderId === o.riderId && e.status !== "cancelled" && Date.now() - e.ts < 120_000);
      mk.getElement().classList.toggle("down", down);
    }
    for (const [id, mk] of otherMarkers.current) {
      if (!seen.has(id)) {
        mk.remove();
        otherMarkers.current.delete(id);
      }
    }
  }, [others, events]);

  // Crash pulse
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const latest = events.find((e) => e.status !== "cancelled");
    if (!latest) {
      crashMarker.current?.remove();
      crashMarker.current = null;
      return;
    }
    if (!crashMarker.current) {
      const c = document.createElement("div");
      c.className = "mf-crash";
      c.innerHTML = `<i></i><i></i><b></b>`;
      crashMarker.current = new Marker({ element: c }).setLngLat([latest.lng, latest.lat]).addTo(m);
      if (!compact) m.easeTo({ center: [latest.lng, latest.lat], zoom: 16.2, pitch: 65, duration: 1600 });
    } else {
      crashMarker.current.setLngLat([latest.lng, latest.lat]);
    }
  }, [events, compact]);

  return (
    <div className={`relative ${className}`}>
      {/* MapLibre's stylesheet sets position: relative on the container, so size it inline. */}
      <div ref={el} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <style jsx global>{`
        .mf-rider {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #f3f3f0;
          box-shadow: 0 0 0 4px rgba(243, 243, 240, 0.18), 0 0 24px rgba(143, 123, 255, 0.9);
          position: relative;
        }
        .mf-rider span {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1.5px solid rgba(243, 243, 240, 0.5);
          animation: mf-ring 1.6s ease-out infinite;
        }
        .mf-rider.off {
          opacity: 0.35;
        }
        .mf-rider.off span {
          display: none;
        }
        .mf-rider.down {
          background: #f0a070;
          box-shadow: 0 0 0 4px rgba(240, 160, 112, 0.25), 0 0 28px rgba(240, 160, 112, 0.9);
        }
        .mf-other {
          position: relative;
          width: 14px;
          height: 14px;
        }
        .mf-other i {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #8f7bff;
          box-shadow: 0 0 0 3px rgba(143, 123, 255, 0.25), 0 0 16px rgba(143, 123, 255, 0.8);
        }
        .mf-other.down i {
          background: #f0a070;
          box-shadow: 0 0 0 3px rgba(240, 160, 112, 0.3), 0 0 18px rgba(240, 160, 112, 0.9);
        }
        .mf-other b {
          position: absolute;
          left: 18px;
          top: -3px;
          font: 500 10px/1 ui-monospace, monospace;
          color: #f3f3f0;
          background: rgba(10, 10, 10, 0.7);
          padding: 3px 6px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .mf-crash {
          width: 10px;
          height: 10px;
          position: relative;
        }
        .mf-crash i {
          position: absolute;
          inset: -30px;
          border-radius: 50%;
          border: 1.5px solid #f0a070;
          animation: mf-pulse 2.2s ease-out infinite;
        }
        .mf-crash i:nth-child(2) {
          animation-delay: 1.1s;
        }
        .mf-crash b {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #f0a070;
        }
        @keyframes mf-ring {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        @keyframes mf-pulse {
          0% {
            transform: scale(0.2);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
