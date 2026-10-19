import { connection, NextResponse } from "next/server";
import { heatBand } from "@/lib/detector";


// Hong Kong Observatory open data: current readings. Falls back to a fixed
// reading if the Observatory is unreachable so the demo never blocks.
export async function GET() {
  await connection();
  try {
    const res = await fetch(
      "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en",
      { cache: "no-store" },
    );
    const j = (await res.json()) as {
      temperature?: { data?: { place: string; value: number }[] };
      humidity?: { data?: { value: number }[] };
      rainfall?: { data?: { place: string; max: number }[] };
    };
    const kp = j.temperature?.data?.find((d) => d.place === "King's Park") ?? j.temperature?.data?.[0];
    const tempC = kp?.value ?? 29;
    const humidity = j.humidity?.data?.[0]?.value ?? 75;
    const rainMax = Math.max(0, ...(j.rainfall?.data?.map((d) => d.max) ?? [0]));
    return NextResponse.json({
      source: "Hong Kong Observatory",
      place: kp?.place ?? "Hong Kong",
      tempC,
      humidity,
      raining: rainMax > 0,
      heat: heatBand(tempC, humidity),
      fetchedAt: Date.now(),
    });
  } catch {
    return NextResponse.json({
      source: "fallback",
      place: "Hong Kong",
      tempC: 29,
      humidity: 75,
      raining: false,
      heat: heatBand(29, 75),
      fetchedAt: Date.now(),
    });
  }
}
