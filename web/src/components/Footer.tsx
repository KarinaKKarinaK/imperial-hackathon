import Link from "next/link";
import { Arrow } from "./Arrow";

export function Footer() {
  return (
    <footer className="px-4 pb-8 pt-16 sm:px-6">
      <div className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="tile tile-paper p-7 sm:p-9">
          <p className="display text-3xl sm:text-4xl">
            Proof for the people
            <br />
            who keep this city moving.
          </p>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed opacity-75">
            MetricsFile is a student team entry to the Imperial Global Hackathon Hong Kong and Macau 2026, open challenge.
            Figures on this page carry their source. Anything marked target or modelled is not yet measured.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="arrow-link">
              Run the live demo <Arrow />
            </Link>
            <a
              href="https://github.com/KarinaKKarinaK/imperial-hackathon"
              target="_blank"
              rel="noreferrer"
              className="arrow-link"
            >
              Source and research <Arrow />
            </a>
          </div>
        </div>
        <div className="tile tile-ink p-7">
          <p className="eyebrow">Policy anchor</p>
          <p className="mt-4 text-[15px] leading-relaxed">
            The Chief Executive&apos;s 2026 Policy Address, paragraph 385, commits to legislation giving delivery platform
            workers &ldquo;statutory compensation for injuries at work&rdquo;.
          </p>
          <p className="mt-4 text-sm opacity-60">Not covered by Challenges 1 to 5: occupational health for platform workers.</p>
        </div>
        <div className="tile tile-violet p-7">
          <p className="eyebrow !opacity-80">Sources</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed">
            <li>C&amp;SD Thematic Household Survey No. 81, Mar 2025</li>
            <li>Labour Department OSH Statistics 2024</li>
            <li>HK High Court, Foodpanda typhoon case, Sep 2025</li>
            <li>Labour and Welfare Bureau proposal, Jul 2026</li>
            <li>ACFTU survey of new forms of employment</li>
            <li>Insurance Authority provisional statistics 2024</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-[1400px] px-2 text-xs opacity-50">MetricsFile 2026. Hong Kong.</p>
    </footer>
  );
}
