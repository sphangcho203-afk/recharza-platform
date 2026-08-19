"""Find validation-capable sub_category_ids for games whose pinned items don't validate.

Shop2TopUp's /catalog/subcategories ignores category_id filtering, so we filter the
full list client-side by category_name / big_category_name and test candidates with
obviously fake player IDs. A candidate is usable when the response contains an
error.code of PLAYER_NOT_FOUND / INVALID_PLAYER_ID / REGION_MISMATCH (validation ran)
rather than INVALID_PRODUCT_CONFIG or NO_PLAYER_VALIDATION_REQUIRED.
"""

import json
import subprocess
import sys

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

# game slug -> (big category substring, fake player id)
GAMES = {
    "free-fire": ("Free Fire", "5123456789"),
    "pubg-mobile": ("PUBG Mobile", "5123456789"),
    "genshin-impact": ("Genshin", "800000001"),
    "valorant": ("Valorant", "Player#TAG"),
    "call-of-duty-mobile": ("Call of Duty", "5123456789"),
    "battlegrounds-mobile-india": ("Battlegrounds", "5123456789"),
    "fortnite": ("Fortnite", "PlayerTag"),
    "league-of-legends-wild-rift": ("Wild Rift", "5123456789"),
    "clash-of-clans": ("Clash", "5123456789"),
}

VALIDATION_CODES = {
    "PLAYER_NOT_FOUND", "INVALID_PLAYER_ID", "REGION_MISMATCH",
    "INVALID_ACCOUNT", "ACCOUNT_NOT_FOUND",
}


def fetch_all_subs():
    # Fetch the global subcategory list (it's the full list regardless of param)
    r = subprocess.run(
        ["curl", "-s", f"{API}/catalog/subcategories", *HDRS],
        capture_output=True, text=True, timeout=180,
    )
    return json.loads(r.stdout)["data"]


def validate(subcat_id, player_id):
    body = json.dumps({"sub_category_id": subcat_id, "player_id": player_id})
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{API}/player/validate", *HDRS,
         "-H", "Content-Type: application/json", "-d", body],
        capture_output=True, text=True, timeout=90,
    )
    return json.loads(r.stdout)


def main():
    subs = fetch_all_subs()
    print(f"Loaded {len(subs)} subcategories", file=sys.stderr)

    results = {}
    for slug, (big, fake_id) in GAMES.items():
        candidates = [
            s for s in subs
            if s.get("big_category_name", "").lower() == big.lower()
            and s.get("fulfillment_type") == "api"
        ]
        print(f"\n== {slug}: {len(candidates)} api subcats", file=sys.stderr)
        hit = None
        for s in candidates[:15]:
            try:
                res = validate(s["id"], fake_id)
            except Exception as e:
                print(f"  {s['id']} {s['name']}: ERR {e}", file=sys.stderr)
                continue
            err_code = (res.get("error") or {}).get("code")
            if err_code in VALIDATION_CODES:
                print(
                    f"  ** {s['id']} ({s['name']}): validation ran -> {err_code}",
                    file=sys.stderr,
                )
                if hit is None:
                    hit = {"sub_category_id": s["id"], "name": s["name"],
                           "sample_response": res}
            else:
                print(f"  {s['id']} ({s['name']}): {err_code or 'ok:' + str(res.get('data'))}",
                      file=sys.stderr)
        results[slug] = hit

    with open("/tmp/s2s-validator-map.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nSaved /tmp/s2s-validator-map.json", file=sys.stderr)


if __name__ == "__main__":
    main()
