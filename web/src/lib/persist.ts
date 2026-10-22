// Optional persistence. If an Upstash Redis REST URL and token are present
// (Vercel Marketplace sets UPSTASH_REDIS_REST_URL / _TOKEN, older KV
// integrations set KV_REST_API_URL / _TOKEN), the whole store is one JSON
// value with a version counter. Without them the store is in memory only,
// which is fine for a single warm instance.
//
// Writes are compare-and-set: a save only lands if nobody else saved since
// this request loaded. Otherwise it throws StoreConflict and the handler
// reloads and runs again, so a rider's cancel can never be overwritten by a
// telemetry post that was in flight.

const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const KEY = "metrics:store:v2";
const VER = "metrics:store:v2:ver";

export const persistenceEnabled = Boolean(URL_ && TOKEN);

export class StoreConflict extends Error {}

async function command<T>(args: (string | number)[]): Promise<T> {
  const r = await fetch(URL_!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return ((await r.json()) as { result: T }).result;
}

const LOAD = "return {redis.call('GET', KEYS[1]) or '', redis.call('GET', KEYS[2]) or '0'}";
const CAS =
  "if (redis.call('GET', KEYS[2]) or '0') == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2]); return redis.call('INCR', KEYS[2]) else return -1 end";

export async function loadStore<T>(): Promise<{ value: T | null; version: string }> {
  if (!persistenceEnabled) return { value: null, version: "0" };
  const [raw, version] = await command<[string, string]>(["EVAL", LOAD, 2, KEY, VER]);
  return { value: raw ? (JSON.parse(raw) as T) : null, version: String(version) };
}

// Returns the new version. Throws StoreConflict if another request saved first.
export async function saveStore(value: unknown, version: string): Promise<string> {
  if (!persistenceEnabled) return version;
  const next = await command<number>(["EVAL", CAS, 2, KEY, VER, version, JSON.stringify(value)]);
  if (next === -1) throw new StoreConflict("store changed since load");
  return String(next);
}
