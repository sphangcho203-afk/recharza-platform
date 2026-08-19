"""Confirm which pinned sub_category_ids perform real player validation."""

import json
import subprocess
import sys

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

# slug -> (sub_category_id, fake player id)
CANDIDATES = {
    "pubg-mobile": (12, "5123456789"),
    "free-fire": (28, "5123456789"),
    "genshin-impact": (51, "800000001"),
    "call-of-duty-mobile": (4578, "5123456789"),
    "league-of-legends-wild-rift": (4974, "5123456789"),
    "valorant": (23393, "Player#TAG"),
    "genshin-impact-alt": (4578, "800000001"),  # cross-check
}

VALIDATION_CODES = {
    "PLAYER_NOT_FOUND", "INVALID_PLAYER_ID", "REGION_MISMATCH",
    "INVALID_ACCOUNT", "ACCOUNT_NOT_FOUND",
}


def validate(subcat_id, player_id):
    body = json.dumps({"sub_category_id": subcat_id, "player_id": player_id})
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{API}/player/validate", *HDRS,
         "-H", "Content-Type: application/json", "-d", body],
        capture_output=True, text=True, timeout=90,
    )
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:200]}


def main():
    results = {}
    for slug, (sub, pid) in CANDIDATES.items():
        res = validate(sub, pid)
        err_code = (res.get("error") or {}).get("code")
        if err_code in VALIDATION_CODES:
            print(f"VALIDATOR ** {slug}: subcat {sub} -> {err_code}", file=sys.stderr)
            results[slug] = {"sub_category_id": sub, "sample": err_code}
        else:
            print(f"no-validation {slug}: subcat {sub} -> {err_code or json.dumps(res)[:120]}", file=sys.stderr)
            results[slug] = None
    with open("/tmp/s2s-final-validators.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Saved /tmp/s2s-final-validators.json", file=sys.stderr)


if __name__ == "__main__":
    main()
