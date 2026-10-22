"""End-to-end validation of the live backend and model.

Usage: python3 scripts/validate_prod.py [env-file] [base-url]

The env file comes from `vercel env pull .env.production.local --environment production`
and supplies the Redis REST URL and token so the script can read what the server
wrote. Checks: persistence across parallel instances, every synthetic scenario
through the detector, event lifecycle, parity of the production model with the
Python model on the same windows, the weather feed, and input validation.
"""
import json, os, ssl, sys, time, urllib.request, concurrent.futures as cf
from pathlib import Path
CTX = ssl.create_default_context(cafile="/etc/ssl/cert.pem" if Path("/etc/ssl/cert.pem").exists() else None)
B = sys.argv[2] if len(sys.argv) > 2 else "https://metricsfile.vercel.app"
ENV_FILE = sys.argv[1] if len(sys.argv) > 1 else ".env.production.local"
env = dict(l.strip().split("=", 1) for l in open(ENV_FILE) if "=" in l and not l.startswith("#"))
KV = env["KV_REST_API_URL"].strip('"'); TOK = env["KV_REST_API_TOKEN"].strip('"')
HERE = Path(__file__).resolve().parent.parent

KEY = os.urandom(16).hex()  # this run's rider key

def req(path, body=None, method=None, key=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"content-type": "application/json"}
    if key:
        headers["x-rider-key"] = key
    r = urllib.request.Request(B + path, data=data, method=method or ("POST" if data else "GET"), headers=headers)
    try:
        with urllib.request.urlopen(r, timeout=30, context=CTX) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")

def kv_get(key):
    r = urllib.request.Request(f"{KV}/get/{key}", headers={"Authorization": f"Bearer {TOK}"})
    with urllib.request.urlopen(r, timeout=20, context=CTX) as resp:
        return json.loads(resp.read())["result"]

ok = True
def check(name, cond, detail=""):
    global ok
    ok &= bool(cond)
    print(("PASS " if cond else "FAIL ") + name + (f"  {detail}" if detail else ""))

print("== A. persistence")
req("/api/sim", {"action": "reset"})
s, d = req("/api/sim", {"action": "start"})
check("start shift", s == 200 and d["rider"]["onShift"])
time.sleep(1.5)
raw = kv_get("metrics:store:v1")
check("store written to Redis", raw is not None, f"{len(raw or '')} bytes")
st = json.loads(raw) if raw else {}
check("Redis holds the demo rider on shift", any(r[0] == "rider-demo" and r[1]["onShift"] for r in st.get("riders", [])))
# hammer with parallel requests to spread across instances
with cf.ThreadPoolExecutor(24) as ex:
    res = list(ex.map(lambda _: req("/api/state")[1]["rider"]["onShift"], range(24)))
check("24 parallel reads all see the shift", all(res), f"{sum(res)}/24")

print("== B. scenarios through the live detector")
expect = {"riding": False, "braking": False, "pothole": False, "set_down": False, "bag_drop": False, "crash": True}
ps = {}
for sc, want in expect.items():
    s, d = req("/api/sim", {"action": "replay", "value": sc})
    ld = d["rider"]["lastDetection"]; ps[sc] = ld["p"]
    check(f"{sc:9s} p={ld['p']:.3f} crash={ld['isCrash']}", s == 200 and ld["isCrash"] == want)
s, d = req("/api/state")
check("exactly one event after the crash", len(d["events"]) == 1, f"events={len(d['events'])}")
ev = d["events"][0]
check("event names platform and job", ev["platform"] == "Platform A" and str(ev["jobId"]).startswith("ORD-"))
check("event is in the 30 s window", ev["status"] == "detected" and ev["cancelDeadline"] - ev["ts"] >= 30000)
with cf.ThreadPoolExecutor(24) as ex:
    counts = list(ex.map(lambda _: len(req("/api/state")[1]["events"]), range(24)))
check("24 parallel reads all see the event", all(c == 1 for c in counts), f"{counts.count(1)}/24")
check("event is signed", isinstance(ev.get("signature"), str) and len(ev["signature"]) > 40)
check("event carries the delivery countdown", isinstance(ev.get("deadlineSec"), int), f"deadlineSec={ev.get('deadlineSec')}")
s, vr = req("/api/verify", ev)
check("production verifies its own signature", s == 200 and vr.get("valid") is True)
bad = dict(ev); bad["platform"] = "Platform B"
s, vr = req("/api/verify", bad)
check("a tampered record fails verification", s == 200 and vr.get("valid") is False)
s, ex = req(f"/api/events/{ev['id']}")
check("rider export has record, key and verify URL", s == 200 and "publicKey" in ex and ex["record"]["id"] == ev["id"])
check("rider record page renders", urllib.request.urlopen(urllib.request.Request(B + f"/r/{ev['id']}"), context=CTX).status == 200)
for sc in ["pothole", "braking", "braking"]:
    req("/api/sim", {"action": "replay", "value": sc})
s, d = req("/api/state")
check("jolts become de-identified hazard cells", len(d.get("hazards", [])) >= 1 and all("riderId" not in h for h in d["hazards"]))
check("a stranger cannot cancel the event", req(f"/api/events/{ev['id']}/cancel", {}, "POST")[0] == 403)
s, d = req("/api/sim", {"action": "ok"})
mine = next((e for e in d["events"] if e["id"] == ev["id"]), {})
check("rider cancel inside the window, outcome signed", s == 200 and mine.get("status") == "cancelled" and mine.get("settlement", {}).get("status") == "cancelled")
time.sleep(1.5)
st = json.loads(kv_get("metrics:store:v2"))
check("cancel persisted to Redis", any(e["id"] == ev["id"] and e["status"] == "cancelled" for e in st["events"]))

print("== C. parity: production model vs Python model on the same windows")
par = json.load(open(HERE / "src/lib/ml/parity.json"))
rid = "rider-parity"
rid = "rider-parity-" + KEY[:6]
req("/api/shift", {"riderId": rid, "onShift": False}, key=KEY)
worst = 0
for v in par:
    base = int(time.time() * 1000) - 7000
    samples = [{"t": base + int(t * 1000), "ax": ax * 9.81, "ay": ay * 9.81, "az": az * 9.81} for t, ax, ay, az in v["samples"]]
    s, d = req("/api/telemetry", {"riderId": rid, "samples": samples}, key=KEY)
    time.sleep(0.6)  # stay under the per-rider rate limit
    p = d["detection"]["confidence"]
    diff = abs(p - v["p"]); worst = max(worst, diff)
    check(f"{v['source']:24s} py={v['p']:.3f} prod={p:.3f}", s == 200 and diff < 0.01)
print(f"   worst gap {worst:.4f}")

print("== D. weather and validation")
s, d = req("/api/weather")
check("Hong Kong Observatory reading", s == 200 and d["source"] == "Hong Kong Observatory", f"{d.get('tempC')}C {d.get('humidity')}% {d.get('heat')}")
check("rejects bad telemetry", req("/api/telemetry", {"riderId": "x", "samples": "no"})[0] == 400)
check("rejects oversize rider id", req("/api/telemetry", {"riderId": "x" * 200, "samples": [{"t": 1, "ax": 0, "ay": 0, "az": 9.81}]})[0] == 400)
check("rejects unknown sim action", req("/api/sim", {"action": "nope"})[0] == 400)
now = int(time.time() * 1000)
check("rejects a window spanning years", req("/api/telemetry", {"riderId": rid, "samples": [{"t": 0, "ax": 0, "ay": 0, "az": 9.81}, {"t": now, "ax": 0, "ay": 0, "az": 9.81}]}, key=KEY)[0] == 400)
check("refuses telemetry without the rider key", req("/api/telemetry", {"riderId": rid, "samples": [{"t": now - 1000, "ax": 0, "ay": 0, "az": 9.81}, {"t": now, "ax": 0, "ay": 0, "az": 9.81}]})[0] == 403)
req("/api/rider", {"riderId": rid, "emergencyContact": "+85291234567"}, key=KEY)
check("contact hidden without the key", req(f"/api/state?riderId={rid}")[1]["rider"]["emergencyContact"] is None)
check("contact shown with the key", req(f"/api/state?riderId={rid}", key=KEY)[1]["rider"]["emergencyContact"] == "+85291234567")
s, d = req("/api/state")
check("no other rider's contact on the shared map", all(o.get("emergencyContact") is None and o.get("lastWindow") is None for o in d["others"]))
sample = next((e for e in d["allEvents"] if e.get("sample")), None)
s, vr = req("/api/verify", sample) if sample else (0, {})
check("sample event: facts and settlement verify", vr.get("valid") is True and vr.get("settlementValid") is True)
s, lab = req("/api/labour")
check("labour view is aggregate only", s == 200 and lab["total"] >= 1 and "rider-" not in json.dumps(lab))
check("rejects unknown scenario", req("/api/sim", {"action": "replay", "value": "meteor"})[0] == 400)
req("/api/sim", {"action": "reset"})
print("\nALL PASS" if ok else "\nSOME CHECKS FAILED")
sys.exit(0 if ok else 1)
