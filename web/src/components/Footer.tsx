import Link from "next/link";
import { Arrow } from "./Arrow";

export function Footer() {
  return (
    <footer className="px-4 pb-8 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="tile tile-paper p-7 sm:p-9">
          <p className="display text-3xl sm:text-4xl">
            Proof for the people
            <br />
            who keep this city moving.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/demo" className="arrow-link">
              Live demo <Arrow />
            </Link>
            <Link href="/rider" className="arrow-link">
              Rider app <Arrow />
            </Link>
            <a href="https://github.com/KarinaKKarinaK/imperial-hackathon" target="_blank" rel="noreferrer" className="arrow-link">
              Source <Arrow />
            </a>
          </div>
        </div>
        <div className="tile tile-haze tile-grain flex flex-col justify-end p-7">
          <p className="eyebrow">Policy anchor</p>
          <p className="mt-3 text-[15px] leading-relaxed">
            2026 Policy Address, paragraph 385: &ldquo;statutory compensation for injuries at work&rdquo; for delivery platform workers.
          </p>
        </div>
        <div className="tile tile-night p-7">
          <p className="eyebrow">Sources</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed opacity-80">
            <li>C&amp;SD Thematic Household Survey No. 81</li>
            <li>Labour Department OSH Statistics 2024</li>
            <li>High Court, Foodpanda typhoon case, 2025</li>
            <li>Labour and Welfare Bureau proposal, Jul 2026</li>
            <li>UMAFall dataset, Universidad de Malaga, CC BY 4.0</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-6 flex max-w-[1400px] items-center justify-between px-2 text-xs opacity-50">
        <span>Metrics, Hong Kong, 2026.</span>
        <span>Figures marked target or modelled are not yet measured.</span>
      </p>
    </footer>
  );
}
