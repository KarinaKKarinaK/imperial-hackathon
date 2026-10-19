// Tamper-evident records. The server signs the impact facts of every event
// with Ed25519. The public key is published at /api/schema and anyone can
// check a record at /api/verify without trusting us.
//
// The private key comes from RECORD_SIGNING_KEY (PKCS8 PEM). Without it a
// key pair is generated per process, which is fine for local work and wrong
// for production: records would verify only against that instance.

import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";
import type { EventRecord } from "./schema";

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

// The facts a dispute turns on. Status and payment change later and are not
// part of what is signed.
export const SIGNED_FIELDS = ["id", "riderId", "platform", "jobId", "ts", "deadlineSec", "mode", "lat", "lng", "peakG", "tiltDeg", "stillSec", "confidence", "context"] as const;

export function canonical(e: Pick<EventRecord, (typeof SIGNED_FIELDS)[number]>): string {
  const obj: Record<string, unknown> = {};
  for (const k of SIGNED_FIELDS) obj[k] = e[k];
  return JSON.stringify(obj);
}

export function signRecord(e: Pick<EventRecord, (typeof SIGNED_FIELDS)[number]>): string {
  return sign(null, Buffer.from(canonical(e)), keys().priv).toString("base64url");
}

export function verifyRecord(e: Pick<EventRecord, (typeof SIGNED_FIELDS)[number]>, signature: string, pubPem?: string): boolean {
  try {
    const pub = pubPem ? createPublicKey(pubPem) : keys().pub;
    return verify(null, Buffer.from(canonical(e)), pub, Buffer.from(signature, "base64url"));
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
