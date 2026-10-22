"""Pull donated research-mode windows from the live store into ml/data/field/.

Usage, from ml/: python3 pull_field_data.py [../web/.env.production.local]

Each file is one window: {"id","kind":"ride"|"event","label","source","day",
"durationS","samples":[[t_s, ax_g, ay_g, az_g], ...]}. No rider id, no
position. ml/data/ is gitignored, so field data never enters the repo.
Then run python3 stream_eval.py to measure false alarms per real riding hour.
"""

import json
import ssl
import sys
import urllib.request
from pathlib import Path

ENV = Path(sys.argv[1] if len(sys.argv) > 1 else "../web/.env.production.local")
OUT = Path(__file__).resolve().parent / "data" / "field"


def main() -> None:
    env = dict(l.strip().split("=", 1) for l in ENV.read_text().splitlines() if "=" in l and not l.startswith("#"))
    url, token = env["KV_REST_API_URL"].strip('"'), env["KV_REST_API_TOKEN"].strip('"')
    ctx = ssl.create_default_context(cafile="/etc/ssl/cert.pem" if Path("/etc/ssl/cert.pem").exists() else None)
    req = urllib.request.Request(url, data=json.dumps(["LRANGE", "metrics:field:v1", 0, -1]).encode(), headers={"Authorization": f"Bearer {token}", "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
        items = json.loads(r.read())["result"] or []
    OUT.mkdir(parents=True, exist_ok=True)
    kinds: dict[str, float] = {}
    for raw in items:
        w = json.loads(raw)
        w.pop("tag", None)  # the deletion tag is not needed for training
        (OUT / f"{w['id']}.json").write_text(json.dumps(w))
        key = f"{w['kind']}:{w['label']}"
        kinds[key] = kinds.get(key, 0) + (w["durationS"] if w["kind"] == "ride" else 1)
    print(f"{len(items)} windows written to {OUT}")
    for k, v in sorted(kinds.items()):
        print(f"  {k}: {v:.1f} {'s' if k.startswith('ride') else 'windows'}")


if __name__ == "__main__":
    main()
