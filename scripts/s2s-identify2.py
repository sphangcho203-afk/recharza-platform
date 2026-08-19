"""Identify subcats 101-119: test validation with different fake id shapes
to detect requirement fields (MISSING_REQUIRED_FIELD reveals needed fields),
and cross-check with the categories endpoint for matching item names."""

import json
import subprocess

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]


def validate(sid, payload):
    body = json.dumps({"sub_category_id": sid, **payload})
    r = subprocess.run(["curl", "-s", "-X", "POST", f"{API}/player/validate",
                        *HDRS, "-H", "Content-Type: application/json", "-d", body],
                       capture_output=True, text=True, timeout=60)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:120]}


# Genshin-style UID: numeric 800000001; Valorant: Player#TAG
tests = [
    ("player_id only", {"player_id": "5123456789"}),
    ("genshin uid", {"player_id": "800000001"}),
    ("player+zone", {"player_id": "5123456789", "zone_id": "2013"}),
    ("player+server", {"player_id": "5123456789", "server": "asia"}),
]

for sid in range(101, 120):
    print(f"\n=== subcat {sid} ===")
    for label, payload in tests:
        res = validate(sid, payload)
        err = (res.get("error") or {}).get("code")
        ok = res.get("success")
        data = res.get("data") or {}
        tag = err if err else ("VALID" if data.get("validated") else
                               data.get("reason", "unknown"))
        print(f"  {label}: {tag}")
