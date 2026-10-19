// Web Bluetooth client for the helmet clip (firmware/esp32_helmet). Works in
// Chrome on Android and desktop. iOS Safari has no Web Bluetooth, so there the
// phone's own sensors are used and the clip logs to serial for the drop tests.
//
// Frame format from the firmware: five frames per notification, each 16 bytes
// little-endian: uint32 t_ms, int16 ax, ay, az (milli-g), int16 gx, gy, gz
// (0.1 deg/s). Samples are converted to m/s^2 and re-stamped onto the phone
// clock so they flow into the same buffer as DeviceMotion samples.

import type { Sample } from "./schema";

export const HELMET_SERVICE = "6d657472-6963-7300-0000-000000000001";
export const HELMET_STREAM = "6d657472-6963-7300-0000-000000000002";
export const HELMET_IMPACT = "6d657472-6963-7300-0000-000000000003";

const G = 9.81;

export function parseFrames(buf: DataView, offsetMs: number): Sample[] {
  const out: Sample[] = [];
  for (let o = 0; o + 16 <= buf.byteLength; o += 16) {
    const t = buf.getUint32(o, true);
    out.push({
      t: offsetMs + t,
      ax: (buf.getInt16(o + 4, true) / 1000) * G,
      ay: (buf.getInt16(o + 6, true) / 1000) * G,
      az: (buf.getInt16(o + 8, true) / 1000) * G,
      gx: buf.getInt16(o + 10, true) / 10,
      gy: buf.getInt16(o + 12, true) / 10,
      gz: buf.getInt16(o + 14, true) / 10,
    });
  }
  return out;
}

export function helmetSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export type HelmetHandle = { name: string; disconnect: () => void };

// Minimal Web Bluetooth types so the build does not need a types package.
type BtChar = {
  value?: DataView;
  addEventListener: (type: "characteristicvaluechanged", cb: (ev: { target: BtChar }) => void) => void;
  startNotifications: () => Promise<unknown>;
};
type BtDevice = {
  name?: string;
  gatt?: { connect: () => Promise<{ getPrimaryService: (uuid: string) => Promise<{ getCharacteristic: (uuid: string) => Promise<BtChar> }> }>; disconnect: () => void };
  addEventListener: (type: "gattserverdisconnected", cb: () => void) => void;
};

// Connect, subscribe, and call onSamples for every notification. onImpact
// fires when the clip's own threshold flag flips, so the phone can wake up
// even if it missed frames.
export async function connectHelmet(onSamples: (s: Sample[]) => void, onImpact?: () => void, onDisconnect?: () => void): Promise<HelmetHandle> {
  const nav = navigator as Navigator & { bluetooth: { requestDevice: (o: unknown) => Promise<BtDevice> } };
  const device = await nav.bluetooth.requestDevice({ filters: [{ services: [HELMET_SERVICE] }] });
  const server = await device.gatt!.connect();
  const svc = await server.getPrimaryService(HELMET_SERVICE);
  const stream = await svc.getCharacteristic(HELMET_STREAM);
  let offset: number | null = null;
  stream.addEventListener("characteristicvaluechanged", (ev) => {
    const v = ev.target.value;
    if (!v) return;
    if (offset === null) offset = Date.now() - v.getUint32(0, true);
    onSamples(parseFrames(v, offset));
  });
  await stream.startNotifications();
  try {
    const impact = await svc.getCharacteristic(HELMET_IMPACT);
    impact.addEventListener("characteristicvaluechanged", (ev) => {
      const v = ev.target.value;
      if (v && v.getUint8(0) === 1) onImpact?.();
    });
    await impact.startNotifications();
  } catch {}
  device.addEventListener("gattserverdisconnected", () => onDisconnect?.());
  return { name: device.name ?? "Metrics Helmet", disconnect: () => device.gatt?.disconnect() };
}
