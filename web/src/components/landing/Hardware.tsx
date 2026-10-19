import Image from "next/image";
import { Reveal } from "../Reveal";

const PARTS: [string, string, string][] = [
  ["ESP32 DevKit V1", "ESP-WROOM-32 dev board, BLE to the phone, 100 Hz", "HK$40"],
  ["GY-521 breakout", "MPU-6050 six-axis accelerometer and gyroscope, 16 g range", "HK$15"],
  ["500 mAh LiPo, 3.7 V", "A full riding day on one charge", "HK$25"],
  ["TP4056 USB-C module", "Charging and battery protection", "HK$10"],
  ["Slide switch, 5 mm LED, jumpers", "Power, a status light, four wires", "HK$10"],
  ["PLA enclosure, two parts", "60 x 35 x 22 mm, 1.6 mm walls, four M2 bosses, about 25 g of filament", "HK$5"],
  ["Elastic strap", "20 x 4 mm slots, through the rear vents of any delivery helmet", "HK$5"],
];
const TOTAL = "HK$110";

export function Hardware() {
  return (
    <section id="hardware" className="px-4 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mb-10 max-w-3xl">
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            About HK$110 of parts
            <br />
            and a 3D printer.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] opacity-70">
            A dev board and a motion breakout in a printed box, strapped to the helmet riders already wear. Nothing custom. A platform
            could equip every rider in Hong Kong for less than the cost of one contested claim.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-12">
          <Reveal className="tile tile-night tile-lift relative min-h-[320px] md:col-span-7 md:min-h-[460px]">
            <Image src="/hardware/exploded-view.jpg" alt="Exploded view of the helmet clip: PLA cover, ESP32 DevKit V1, GY-521, 500 mAh LiPo, TP4056, PLA base with strap" fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover" />
            <span className="pill pill-paper absolute left-5 top-5">Exploded view</span>
          </Reveal>

          <Reveal delay={0.08} className="tile tile-paper flex flex-col p-6 md:col-span-5 sm:p-8">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Bill of materials</p>
              <p className="num text-3xl">{TOTAL}</p>
            </div>
            <table className="mt-4 w-full text-left text-sm">
              <tbody>
                {PARTS.map(([name, what, cost]) => (
                  <tr key={name} className="border-t border-ink/10 align-top">
                    <td className="py-2.5 pr-3 font-medium">{name}</td>
                    <td className="py-2.5 pr-3 text-[13px] opacity-70">{what}</td>
                    <td className="mono py-2.5 text-right text-xs">{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-auto pt-5 text-xs opacity-60">Retail prices in Sham Shui Po, October 2026. At a thousand units the board and sensor roughly halve.</p>
          </Reveal>

          <Reveal delay={0.12} className="tile tile-night tile-lift relative min-h-[320px] md:col-span-8 md:min-h-[520px]">
            <Image src="/hardware/enclosure-blueprint.jpg" alt="Technical drawing of the enclosure with dimensions" fill sizes="(max-width: 768px) 100vw, 66vw" className="object-cover" />
            <span className="pill pill-paper absolute left-5 top-5">Enclosure drawing, 1:1</span>
            <a href="/hardware/enclosure-blueprint.jpg" target="_blank" rel="noreferrer" className="pill pill-outline absolute bottom-5 right-5 bg-ink/60 backdrop-blur">
              Open full size
            </a>
          </Reveal>

          <Reveal delay={0.16} className="tile tile-dusk tile-flow tile-grain flex flex-col justify-between p-6 md:col-span-4 sm:p-8">
            <p className="eyebrow !opacity-80">On the drawing</p>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
              {[
                ["60 x 35 x 22", "mm, outside"],
                ["1.6 mm", "wall, PLA"],
                ["4 x M2", "bosses at 46 x 21 mm"],
                ["20 x 4 mm", "strap slots, both ends"],
                ["100 Hz", "six axes over BLE"],
                ["16 g", "range, enough for a head impact"],
              ].map(([n, t]) => (
                <div key={n}>
                  <p className="num text-3xl">{n}</p>
                  <p className="mt-1 text-sm opacity-85">{t}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs opacity-75">
              Phone-only works today with no hardware at all. The clip adds helmet-grade impact data and a sensor that does not live in a
              pocket. Firmware and drawings are in the repository.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
