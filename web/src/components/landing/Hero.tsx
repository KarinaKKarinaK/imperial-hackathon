"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-12">
        <motion.div {...fade(0)} className="tile tile-paper col-span-1 p-7 sm:p-10 md:col-span-8 lg:p-14">
          <span className="pill pill-outline">Hong Kong</span>
          <h1 className="display mt-8 text-[2.9rem] sm:text-6xl lg:text-[5.6rem]">
            Every crash
            <br />
            gets a record.
            <br />
            Every record
            <br />
            gets paid.
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed opacity-75 sm:text-xl">
            The work-injury record for riders. A coin-sized sensor on the helmet, the phone already in their pocket, and a
            payout that fires the second it should.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/demo" className="inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-paper transition hover:bg-violet">
              See it live <Arrow />
            </Link>
            <a href="#problem" className="arrow-link">
              Why now <Arrow />
            </a>
          </div>
        </motion.div>

        <div className="col-span-1 grid grid-cols-2 gap-4 md:col-span-4">
          <motion.div {...fade(0.1)} className="tile tile-night col-span-2 flex flex-col justify-between p-6">
            <div className="plus" />
            <div>
              <p className="num text-6xl">
                <Counter to={13} suffix="%" />
              </p>
              <p className="mt-3 text-[15px] opacity-80">of injured riders were compensated.</p>
              <p className="mt-1 text-xs opacity-50">2024 union survey</p>
            </div>
          </motion.div>
          <motion.div {...fade(0.15)} className="tile tile-ink aspect-square">
            <Sphere className="absolute inset-0" />
          </motion.div>
          <motion.div {...fade(0.2)} className="tile tile-photo aspect-square">
            <Image src="/img/taxi-motion.jpg" alt="" fill sizes="(max-width: 768px) 50vw, 16vw" priority />
            <Link href="/demo" aria-label="Open the live demo" className="group flex h-full w-full items-end justify-end p-5 text-paper">
              <Arrow size={44} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
        </div>

        <motion.div {...fade(0.25)} className="tile tile-ink col-span-1 flex items-end p-6 md:col-span-3">
          <div>
            <p className="num text-5xl">
              <Counter to={12900} />
            </p>
            <p className="mt-3 text-[15px] opacity-80">riders. Zero employers.</p>
            <p className="mt-1 text-xs opacity-50">C&amp;SD survey, 2025</p>
          </div>
        </motion.div>
        <motion.div {...fade(0.3)} className="tile tile-dusk tile-grain col-span-1 flex items-end p-6 md:col-span-3">
          <div>
            <p className="num text-5xl">
              <Counter to={5} suffix=" yrs" />
            </p>
            <p className="mt-3 text-[15px] opacity-90">for one typhoon injury to be paid.</p>
            <p className="mt-1 text-xs opacity-70">High Court, Sep 2025</p>
          </div>
        </motion.div>
        <motion.div {...fade(0.35)} className="tile tile-paper tile-dots col-span-1 flex items-end p-6 md:col-span-3">
          <div>
            <p className="num text-5xl">
              <Counter to={41254} />
            </p>
            <p className="mt-3 text-[15px] opacity-80">work injury claims a year. Riders are not in that number.</p>
            <p className="mt-1 text-xs opacity-50">Labour Department, 2024</p>
          </div>
        </motion.div>
        <motion.div {...fade(0.4)} className="tile tile-peach tile-grain col-span-1 flex flex-col justify-between p-6 md:col-span-3">
          <div className="flex flex-wrap gap-2">
            <span className="pill pill-paper">Impact</span>
            <span className="pill pill-ink">Fall</span>
            <span className="pill pill-violet">Stillness</span>
          </div>
          <p className="mt-6 text-[15px] leading-snug">Three signals. Nothing else looks like a crash.</p>
        </motion.div>
      </div>
    </section>
  );
}
