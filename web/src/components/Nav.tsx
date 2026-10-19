"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow } from "./Arrow";

const links = [
  { href: "/#problem", label: "Why" },
  { href: "/#system", label: "How" },
  { href: "/#model", label: "Model" },
  { href: "/#hardware", label: "Hardware" },
  { href: "/record", label: "The record" },
  { href: "/demo", label: "Live demo" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between rounded-2xl border border-white/20 bg-ink/80 px-4 py-2.5 backdrop-blur-md sm:rounded-full sm:px-5">
        <Link href="/" className="flex items-center gap-2" aria-label="Metrics home">
          <span className="relative block h-5 w-9">
            <span className="absolute left-0 top-0 h-5 w-5 rounded-full bg-paper" />
            <span className="absolute left-4 top-0 h-5 w-5 rounded-full bg-paper" />
          </span>
          <span className="text-sm font-medium tracking-tight">Metrics</span>
        </Link>
        <ul className="hidden items-center gap-8 text-[15px] md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="opacity-85 transition hover:opacity-100">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            href="/rider"
            className="hidden items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm transition hover:bg-paper hover:text-ink sm:inline-flex"
          >
            Open on your phone <Arrow size={16} />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 md:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 top-0 h-[1.5px] w-4 bg-paper transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`absolute left-0 top-[5px] h-[1.5px] w-4 bg-paper transition ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-[10px] h-[1.5px] w-4 bg-paper transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </nav>
      {open && (
        <div className="mx-auto mt-2 max-w-[1400px] rounded-2xl border border-white/20 bg-ink/95 p-4 backdrop-blur-md md:hidden">
          <ul className="flex flex-col gap-3 text-lg">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-1">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/rider" onClick={() => setOpen(false)} className="arrow-link">
                Open on your phone <Arrow />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
