"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Arrow } from "../Arrow";
import { Counter } from "../Counter";

const Sphere = dynamic(() => import("../Sphere").then((m) => m.Sphere), { ssr: false });

const fade = (d: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: d, ease: [0.16, 1, 0.3, 1] as const },
});

export function Hero() {
  return (
    <section className="px-4 pt-6 sm:px-6">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-[auto_auto]">
        {/* Headline tile */}
        <motion.div {...fade(0)} className="tile tile-paper col-span-1 p-7 sm:p-10 md:col-span-8 md:row-span-1 lg:p-14">
          <div className="flex items-center gap-3">
            <span className="pill pill-ink">Open challenge</span>
            <span className="pill pill-outline">Policy Address 2026, para 385</span>
          </div>
          <h1 className="display mt-8 text-[2.75rem] sm:text-6xl lg:text-[5.4rem]">
            Every crash
            <br />
            gets a record.
            <br />
            Every record
            <br />
            gets paid.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed opacity-80 sm:text-xl">
            The verified work-injury event record for Hong Kong&apos;s delivery riders. A coin-sized helmet sensor, the phone
            they already carry, and a payout that fires the second the law says it should.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/demo" className="inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-paper transition hover:bg-violet">
              Run the live demo <Arrow />
            </Link>
            <a href="#problem" className="arrow-link">
              Start with the numbers <Arrow />
            </a>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-4 md:grid-rows-2">
          <motion.div {...fade(0.1)} className="tile tile-ink col-span-2 flex flex-col justify-between p-6">
            <div className="plus" />
            <div>
              <p className="num text-5xl sm:text-6xl">
                <Counter to={13} suffix="%" />
              </p>
              <p className="mt-3 text-[15px] leading-snug opacity-80">
                of injured riders were compensated.
                <br />
                <span className="opacity-60">2024 union survey</span>
              </p>
            </div>
          </motion.div>
          <motion.div {...fade(0.15)} className="tile tile-ink aspect-square">
            <Sphere className="absolute inset-0" />
          </motion.div>
          <motion.div {...fade(0.2)} className="tile tile-paper flex items-center justify-center">
            <Link href="/demo" aria-label="Open the live demo" className="group flex h-full w-full items-center justify-center">
              <Arrow size={54} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
        </div>

        {/* Bottom row */}
        <motion.div {...fade(0.25)} className="tile tile-ink col-span-1 flex items-end p-6 md:col-span-3">
          <div>
            <p className="num text-5xl">
              <Counter to={12900} />
            </p>
            <p className="mt-3 text-[15px] opacity-80">
              platform delivery workers in Hong Kong. Zero employers.
              <br />
              <span className="opacity-60">C&amp;SD survey, 2025</span>
            </p>
          </div>
        </motion.div>
        <motion.div {...fade(0.3)} className="tile tile-violet tile-grain col-span-1 flex items-end p-6 md:col-span-3">
          <div>
            <p className="num text-5xl">
              <Counter to={5} suffix=" yrs" />
            </p>
            <p className="mt-3 text-[15px] opacity-90">
              for one typhoon injury to reach a High Court payout.
              <br />
              <span className="opacity-70">HK$1.35m, Sep 2025</span>
            </p>
          </div>
        </motion.div>
        <motion.div {...fade(0.35)} className="tile tile-paper tile-dots col-span-1 flex items-end p-6 md:col-span-3">
          <div>
            <p className="num text-5xl">
              <Counter to={41254} />
            </p>
            <p className="mt-3 text-[15px] opacity-80">
              work injury claims a year in Hong Kong. Riders are not in that number.
              <br />
              <span className="opacity-60">Labour Department, 2024</span>
            </p>
          </div>
        </motion.div>
        <motion.div {...fade(0.4)} className="tile tile-peach tile-grain col-span-1 flex flex-col justify-between p-6 md:col-span-3">
          <div className="flex flex-wrap gap-2">
            <span className="pill pill-paper">Impact</span>
            <span className="pill pill-ink">Fall</span>
            <span className="pill pill-violet">Stillness</span>
            <span className="pill pill-lemon">Paid</span>
          </div>
          <p className="mt-6 text-[15px] leading-snug">Three signals. One record. One payout. Nothing else looks like a crash.</p>
        </motion.div>
      </div>
    </section>
  );
}
