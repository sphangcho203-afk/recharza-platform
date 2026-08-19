"""Probe sequential sub_category_ids with a fake player id and record
which ones perform real validation (PLAYER_NOT_FOUND etc.).

This tells us which id ranges correspond to validation-capable games.
Then we cross-reference with the global sub list (id, category_name) to
identify the game.
"""

import json
import subprocess
import sys
import time

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

VALIDATION_CODES = {"PLAYER_NOT_FOUND", "INVALID_PLAYER_ID", "REGION_MISMATCH"}
SKIP_CODES = {"INVALID_PRODUCT_CONFIG", "INVALID_SUBCATEGORY",
              "NO_PLAYER_VALIDATION_REQUIRED", "MISSING_REQUIRED_FIELD"}


def validate(sid, player_id="5123456789"):
    body = json.dumps({"sub_category_id": sid, "player_id": player_id})
    r = subprocess.run(["curl", "-s", "-X", "POST", f"{API}/player/validate",
                        *HDRS, "-H", "Content-Type: application/json", "-d", body],
                       capture_output=True, text=True, timeout=60)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:120]}


def main():
    found = {}
    for sid in range(2, 120):
        res = validate(sid)
        err = (res.get("error") or {})
        code = err.get("code") or ("VALID" if res.get("success") and
                                   isinstance(res.get("data"), dict) and
                                   res["data"].get("validated") else None)
        if code in VALIDATION_CODES or code == "VALID":
            found[sid] = code
            print(f"VALIDATOR subcat {sid} -> {code}", file=sys.stderr)
        time.sleep(0.3)
    with open("/tmp/s2s-range-found.json", "w") as f:
        json.dump(found, f)
    print(f"Done. {len(found)} validators found:", file=sys.stderr)
    print(json.dumps(found), file=sys.stderr)


if __name__ == "__main__":
    main()
