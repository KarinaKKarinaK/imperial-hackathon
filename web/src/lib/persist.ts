// Optional persistence. If an Upstash Redis REST URL and token are present
// (Vercel Marketplace sets UPSTASH_REDIS_REST_URL / _TOKEN, older KV
// integrations set KV_REST_API_URL / _TOKEN), the whole store is saved as one
// JSON value after every write and loaded on a cold start. Without them the
// store is in memory only, which is fine for a single warm instance.

const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const KEY = "metrics:store:v1";

export const persistenceEnabled = Boolean(URL_ && TOKEN);

export async function loadStore<T>(): Promise<T | null> {
  if (!persistenceEnabled) return null;
  try {
    const r = await fetch(`${URL_}/get/${KEY}`, { headers: { Authorization: `Bearer ${TOKEN}` }, cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { result: string | null };
    return j.result ? (JSON.parse(j.result) as T) : null;
  } catch {
    return null;
  }
}

let pending: Promise<void> = Promise.resolve();

// Writes are chained and awaited by the API handler before it responds, so a
// serverless instance never has a write in flight after its response. That is
// what stops a stale write from one instance landing after a newer one.
export function saveStore(value: unknown): Promise<void> {
  if (!persistenceEnabled) return Promise.resolve();
  const body = JSON.stringify(value);
  const run = async () => {
    try {
      await fetch(`${URL_}/set/${KEY}`, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body, cache: "no-store" });
    } catch {}
  };
  pending = pending.then(run, run);
  return pending;
}

export function flushStore(): Promise<void> {
  return pending;
}
