const ITEMS = [
  "12,900 riders in Hong Kong",
  "2 of 22 injured riders compensated by the platform",
  "41,254 work injury claims a year",
  "One in three riders on two apps",
  "Five years for one typhoon case",
  "84 million workers insured next door",
  "Platforms liable from 2026",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="mt-16 overflow-hidden border-y border-white/10 py-4" aria-hidden="true">
      <div className="marquee">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap text-sm opacity-70">
            {t}
            <span className="h-1.5 w-1.5 rounded-full bg-violet-2" />
          </span>
        ))}
      </div>
    </div>
  );
}
