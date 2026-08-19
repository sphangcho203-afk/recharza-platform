"""Scanner v2.

Learning: GET /catalog/subcategories returns generic items (UC Cards etc.)
with no requirements. The categories endpoint (/catalog/categories) lists
per-game CATEGORIES with requirement strings, but validation is per
sub_category_id.

New strategy:
- Categories endpoint returns objects that include 'subcategories' lists
  (2621 subs for MLBB cat 474). Check structure.
- For each of our games, fetch their category and any nested subcategory
  structure; test validation on direct-topup items (non-voucher) whose
  name implies diamonds/crystals/uc/top-up.
- Rate-limit aware: cap total validate calls at 25.
"""

import json
import subprocess
import sys

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

VALIDATION_CODES = {"PLAYER_NOT_FOUND", "INVALID_PLAYER_ID", "REGION_MISMATCH"}
SKIP_CODES = {"INVALID_PRODUCT_CONFIG", "INVALID_SUBCATEGORY",
              "NO_PLAYER_VALIDATION_REQUIRED", "MISSING_REQUIRED_FIELD"}

GAMES = [
    ("pubg-mobile", 2, "5123456789"),
    ("genshin-impact", 6, "800000001"),
    ("free-fire", 4, "5123456789"),   # re-verify our known one for consistency
    ("valorant", 2764, "Player#TAG"),
    ("valorant-2", 2949, "Player#TAG"),
]

CALLS = [0]


def fetch(path):
    r = subprocess.run(["curl", "-s", path, *HDRS],
                       capture_output=True, text=True, timeout=120)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:300]}


def validate(subcat_id, player_id):
    CALLS[0] += 1
    body = json.dumps({"sub_category_id": subcat_id, "player_id": player_id})
    r = subprocess.run(["curl", "-s", "-X", "POST", f"{API}/player/validate",
                        *HDRS, "-H", "Content-Type: application/json", "-d", body],
                       capture_output=True, text=True, timeout=90)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:200]}


def inspect_cats():
    cats = fetch(f"{API}/catalog/categories")
    print(json.dumps(cats, indent=2)[:2500])


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "inspect":
        inspect_cats()
        return

    results = {}
    for slug, cat_id, fake_id in GAMES:
        d = fetch(f"{API}/catalog/category/{cat_id}/requirements")
        reqs = d if isinstance(d, list) else d.get("data", d)
        print(f"\n=== {slug} (cat {cat_id}) requirements: {json.dumps(reqs)[:300]}", file=sys.stderr)
        # find subcats: the requirements endpoint may include sub list; otherwise
        # try /catalog/category/{cat_id}/subcategories
        subs = fetch(f"{API}/catalog/category/{cat_id}/subcategories")
        items = subs if isinstance(subs, list) else subs.get("data", [])
        print(f"  subcats found: {len(items) if isinstance(items, list) else json.dumps(subs)[:150]}", file=sys.stderr)
        if isinstance(items, list):
            # save a sample for inspection
            with open(f"/tmp/s2s-cat{cat_id}-subs.json", "w") as f:
                json.dump(items, f, indent=2)
            # check requirements on first direct-topup items
            for it in items[:6]:
                print(f"  - sub {it.get('id')} {it.get('name')} | req: {json.dumps(it.get('requirements'))[:150]}", file=sys.stderr)


if __name__ == "__main__":
    main()
