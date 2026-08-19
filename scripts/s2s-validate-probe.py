"""Find a working verification sub_category_id for each of our games on Shop2TopUp.

Strategy: for each game's category, list subcategories, pick direct-topup items (not
voucher cards), and probe POST /player/validate. A subcat is usable for identity
verification when the response is NOT INVALID_PRODUCT_CONFIG (i.e. the supplier API
supports player validation for that item).

We send obviously-fake IDs so we only care about whether validation is *configured*,
not whether the account exists.
"""

import json
import subprocess
import sys

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

# Our game slug -> Shop2TopUp big_category_name substring, requirement fields we'd send
GAMES = {
    "mobile-legends": {"big": "Mobile Legends", "fields": {"player_id": "1122334455", "zone_id": "2013"}},
    "free-fire": {"big": "Free Fire", "fields": {"player_id": "5123456789"}},
    "pubg-mobile": {"big": "PUBG Mobile", "fields": {"player_id": "5123456789"}},
    "genshin-impact": {"big": "Genshin", "fields": {"player_id": "800000001"}},
    "call-of-duty-mobile": {"big": "Call of Duty", "fields": {"player_id": "5123456789"}},
    "valorant": {"big": "Valorant", "fields": {"player_id": "Player#TAG"}},
    "fortnite": {"big": "Fortnite", "fields": {"player_id": "PlayerTag"}},
    "battlegrounds-mobile-india": {"big": "Battlegrounds", "fields": {"player_id": "5123456789"}},
    "league-of-legends-wild-rift": {"big": "Wild Rift", "fields": {"player_id": "5123456789"}},
    "clash-of-clans": {"big": "Clash", "fields": {"player_id": "5123456789"}},
}


def fetch(path, params=""):
    url = f"{API}/{path}{params}"
    r = subprocess.run(["curl", "-s", url, *HDRS], capture_output=True, text=True, timeout=120)
    return json.loads(r.stdout)


def validate(body):
    r = subprocess.run(
        [
            "curl", "-s", "-X", "POST", f"{API}/player/validate", *HDRS,
            "-H", "Content-Type: application/json", "-d", json.dumps(body),
        ],
        capture_output=True, text=True, timeout=120,
    )
    return json.loads(r.stdout)


def find_categories():
    cats = fetch("catalog/categories")["data"]
    found = {}
    for slug, meta in GAMES.items():
        hits = [c for c in cats if meta["big"].lower() in c["big_category_name"].lower()]
        found[slug] = hits
    return found


def main():
    found = find_categories()
    results = {}
    for slug, cats in found.items():
        print(f"\n== {slug}: {len(cats)} candidate categories", file=sys.stderr)
        for c in cats[:5]:
            print(f"  cat id={c['id']} {c['big_category_name']} / {c['name']} req={c.get('requirements')}", file=sys.stderr)
        # Probe up to 12 non-voucher subcategories from the first category
        best = None
        if not cats:
            results[slug] = None
            continue
        subs = fetch("catalog/subcategories", f"?category_id={cats[0]['id']}")["data"]
        direct = [s for s in subs if s.get("fulfillment_type") != "voucher"][:12]
        for s in direct:
            body = {"sub_category_id": s["id"], **GAMES[slug]["fields"]}
            try:
                res = validate(body)
            except Exception as e:
                print(f"    sub {s['id']} {s['name']}: ERROR {e}", file=sys.stderr)
                continue
            code = (res.get("error") or {}).get("code") if not res.get("success") else None
            if code == "INVALID_PRODUCT_CONFIG":
                continue
            print(
                f"    sub {s['id']} ({s['name']}): success={res.get('success')} "
                f"code={code} body={json.dumps(res)[:160]}",
                file=sys.stderr,
            )
            if best is None and (res.get("success") or code in (
                "MISSING_REQUIRED_FIELD", "INVALID_PLAYER_ID", "PLAYER_NOT_FOUND",
                "REGION_MISMATCH",
            )):
                best = {
                    "category_id": cats[0]["id"],
                    "sub_category_id": s["id"],
                    "name": s["name"],
                    "requirements": cats[0].get("requirements"),
                    "sample_response": res,
                }
                # keep scanning a few more for comparison
        results[slug] = best

    with open("/tmp/s2s-validate-mapping.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nSaved mapping to /tmp/s2s-validate-mapping.json", file=sys.stderr)


if __name__ == "__main__":
    main()
