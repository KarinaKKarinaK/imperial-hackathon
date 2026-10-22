// Tamper-evident records. The server signs the impact facts of every event
// with Ed25519, and signs the outcome again once it is final. The public key
// is published at /api/schema and anyone can check a record at /api/verify
// without trusting us.
//
// The private key comes from RECORD_SIGNING_KEY (PKCS8 PEM). Without it a
// key pair is generated per process, which is fine for local work and wrong
// for production: records would verify only against that instance.

import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";
import type { EventRecord, Settlement } from "./schema";

type Keys = { priv: KeyObject; pub: KeyObject; pubPem: string; ephemeral: boolean };
const g = globalThis as unknown as { __mf_keys?: Keys };

function keys(): Keys {
  if (g.__mf_keys) return g.__mf_keys;
  const pem = process.env.RECORD_SIGNING_KEY?.replace(/\\n/g, "\n");
  let priv: KeyObject;
  let ephemeral = false;
  if (pem) {
    priv = createPrivateKey(pem);
  } else {
    priv = generateKeyPairSync("ed25519").privateKey;
    ephemeral = true;
  }
  const pub = createPublicKey(priv);
  g.__mf_keys = { priv, pub, pubPem: pub.export({ type: "spki", format: "pem" }).toString(), ephemeral };
  return g.__mf_keys;
}

// The facts a dispute turns on. Status and payment change later and are
// signed separately, once final, in the settlement.
export const SIGNED_FIELDS = [
  "id", "riderId", "platform", "jobId", "activeJobs", "apportionment", "sources", "prevHash",
  "ts", "deadlineSec", "mode", "lat", "lng", "peakG", "tiltDeg", "stillSec", "confidence", "context",
] as const;
// Version 1 records (before 23 Oct 2026) signed fewer fields in arrival order.
const SIGNED_FIELDS_V1 = ["id", "riderId", "platform", "jobId", "ts", "deadlineSec", "mode", "lat", "lng", "peakG", "tiltDeg", "stillSec", "confidence", "context"] as const;

type Facts = Pick<EventRecord, (typeof SIGNED_FIELDS)[number]>;

// Keys sorted at every level, so a verifier that reorders JSON keys gets the
// same bytes.
function sorted(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sorted);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sorted((v as Record<string, unknown>)[k])]));
  }
  return v;
}

export function canonical(e: Partial<Facts>): string {
  const obj: Record<string, unknown> = {};
  for (const k of SIGNED_FIELDS) obj[k] = e[k] ?? null;
  return JSON.stringify(sorted(obj));
}

function canonicalV1(e: Partial<EventRecord>): string {
  const obj: Record<string, unknown> = {};
  for (const k of SIGNED_FIELDS_V1) obj[k] = e[k];
  return JSON.stringify(obj);
}

function ok(text: string, signature: string, pub: KeyObject): boolean {
  try {
    return verify(null, Buffer.from(text), pub, Buffer.from(signature, "base64url"));
  } catch {
    return false;
  }
}

function pubKey(pubPem?: string): KeyObject {
  return pubPem ? createPublicKey(pubPem) : keys().pub;
}

export function signRecord(e: Facts): string {
  return sign(null, Buffer.from(canonical(e)), keys().priv).toString("base64url");
}

export function verifyRecord(e: Partial<EventRecord>, signature: string, pubPem?: string): boolean {
  try {
    const pub = pubKey(pubPem);
    return ok(canonical(e), signature, pub) || ok(canonicalV1(e), signature, pub);
  } catch {
    return false;
  }
}

// Hash chain: each record carries the hash of the rider's previous record.
// Deleting or rewriting an old record breaks the link from the next one.
export function recordHash(e: Partial<Facts> & { signature?: string | null }): string {
  return createHash("sha256").update(canonical(e) + (e.signature ?? "")).digest("hex");
}

function settlementText(id: string, s: Omit<Settlement, "signature">, factsSignature: string | null): string {
  return JSON.stringify(sorted({ id, status: s.status, paidAt: s.paidAt, payoutHkd: s.payoutHkd, at: s.at, factsSignature }));
}

export function signSettlement(e: Pick<EventRecord, "id" | "signature">, s: Omit<Settlement, "signature">): Settlement {
  const signature = sign(null, Buffer.from(settlementText(e.id, s, e.signature)), keys().priv).toString("base64url");
  return { ...s, signature };
}

export function verifySettlement(e: Pick<EventRecord, "id" | "signature" | "settlement">, pubPem?: string): boolean {
  if (!e.settlement || typeof e.settlement.signature !== "string") return false;
  try {
    return ok(settlementText(e.id, e.settlement, e.signature), e.settlement.signature, pubKey(pubPem));
  } catch {
    return false;
  }
}

export function publicKeyPem(): string {
  return keys().pubPem;
}

export function signingIsEphemeral(): boolean {
  return keys().ephemeral;
}
