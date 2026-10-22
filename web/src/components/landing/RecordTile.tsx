"use client";

import { useEffect, useState } from "react";

const LINES = [
  ['"id"', '"EVT-7K2M"'],
  ['"platform"', '"Platform A"'],
  ['"job"', '"ORD-4471"'],
  ['"active_jobs"', '["A", "B"]'],
  ['"apportionment"', '"A 0.5, B 0.5"'],
  ['"ts"', '"14:32:07 HKT"'],
  ['"peak_g"', "14.2"],
  ['"tilt_deg"', "82"],
  ['"still_s"', "8.0"],
  ['"p_crash"', "0.97"],
  ['"status"', '"paid"'],
];

// The event record, typed out line by line. This is the whole product.
export function RecordTile({ className = "" }: { className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x >= LINES.length + 6 ? 0 : x + 1)), 420);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={`mono text-[13px] leading-relaxed ${className}`}>
      <p className="opacity-60">{"{"}</p>
      {LINES.map(([k, v], i) => (
        <p key={k} className={`pl-4 transition-opacity duration-300 ${i < n ? "opacity-100" : "opacity-0"}`}>
          <span className="text-violet-2">{k}</span>
          <span className="opacity-60">: </span>
          <span className={v.startsWith('"') ? "text-paper" : "text-peach"}>{v}</span>
          {i < LINES.length - 1 && <span className="opacity-60">,</span>}
        </p>
      ))}
      <p className="opacity-60">{"}"}</p>
    </div>
  );
}
