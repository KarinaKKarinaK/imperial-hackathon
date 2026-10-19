import { ImageResponse } from "next/og";

export const alt = "Metrics. Every crash gets a record. Every record gets paid.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          padding: 36,
          fontFamily: "Helvetica, Arial, sans-serif",
          color: "#0a0a0a",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#f3f3f0",
            borderRadius: 40,
            padding: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26 }}>
            <div style={{ display: "flex" }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, background: "#0a0a0a" }} />
              <div style={{ width: 28, height: 28, borderRadius: 999, background: "#0a0a0a", marginLeft: -8 }} />
            </div>
            <span style={{ fontWeight: 600 }}>Metrics</span>
            <span style={{ opacity: 0.5 }}>Hong Kong</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 86, lineHeight: 0.98, letterSpacing: -4, fontWeight: 600 }}>
            <span>Every crash gets a record.</span>
            <span>Every record gets paid.</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 24 }}>
            <span style={{ opacity: 0.7, maxWidth: 700 }}>The work-injury record for delivery riders. A 3D-printed helmet clip, a crash model with error bars, a payout in a day.</span>
            <span style={{ background: "#6b4cff", color: "#fff", borderRadius: 999, padding: "12px 22px", fontSize: 22 }}>metricsfile.vercel.app</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
