// A delivery loop through Mong Kok and Yau Ma Tei, Kowloon. [lng, lat].
export const ROUTE: [number, number][] = [
  [114.1694, 22.3193],
  [114.1702, 22.3215],
  [114.1716, 22.3236],
  [114.1733, 22.3252],
  [114.1751, 22.3241],
  [114.1762, 22.3218],
  [114.1748, 22.3196],
  [114.1731, 22.3174],
  [114.1709, 22.3166],
  [114.1694, 22.3193],
];

export const CRASH_POINT: [number, number] = [114.1762, 22.3218];

export function pointAt(u: number): [number, number] {
  const n = ROUTE.length - 1;
  const x = Math.min(0.9999, Math.max(0, u)) * n;
  const i = Math.floor(x);
  const f = x - i;
  const a = ROUTE[i];
  const b = ROUTE[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
