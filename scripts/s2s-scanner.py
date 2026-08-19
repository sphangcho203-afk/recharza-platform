"""Systematically find validation-capable Shop2TopUp items for our games.

Strategy:
1. Get ALL subcategories (the /catalog/subcategories endpoint returns the global
   list regardless of the category_id filter — noted earlier).
2. For each subcategory, check its `requirements` field against the game's
   expected fields (MLBB: player_id + zone_id; others: player_id).
3. Test POST /player/validate on candidates; codes PLAYER_NOT_FOUND /
   INVALID_PLAYER_ID / REGION_MISMATCH mean real validation runs.
"""

import json
import re
import subprocess
import sys

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

VALIDATION_CODES = {
    "PLAYER_NOT_FOUND", "INVALID_PLAYER_ID", "REGION_MISMATCH",
    "INVALID_ACCOUNT", "ACCOUNT_NOT_FOUND",
}
SKIP_CODES = {
    "INVALID_PRODUCT_CONFIG", "INVALID_SUBCATEGORY", "NO_PLAYER_VALIDATION_REQUIRED",
    "MISSING_REQUIRED_FIELD",
}

# game -> (category name keywords, required fields, fake player id)
GAMES = {
    "pubg-mobile": (["PUBG", "PUBG Mobile"], ["player_id"], "5123456789"),
    "battlegrounds-mobile-india": (["BGMI", "Battlegrounds Mobile India", "PUBG India"], ["player_id"], "5123456789"),
    "genshin-impact": (["Genshin"], ["player_id"], "800000001"),
    "call-of-duty-mobile": (["Call of Duty Mobile", "CODM", "Call of Duty"], ["player_id"], "5123456789"),
    "valorant": (["Valorant"], ["player_id", "player_id, tag", "riot"], "Player#TAG"),
    "league-of-legends-wild-rift": (["Wild Rift"], ["player_id"], "5123456789"),
    "fortnite": (["Fortnite"], ["player_id"], "5123456789"),
    "clash-of-clans": (["Clash of Clans"], ["player_id"], "5123456789"),
}


def fetch_json(endpoint, params=""):
    r = subprocess.run(
        ["curl", "-s", f"{API}/{endpoint}", *HDRS],
        capture_output=True, text=True, timeout=120,
    )
    try:
        return json.loads(r.stdout)
    except Exception:
        print(f"!! fetch failed {endpoint}: {r.stdout[:120]}", file=sys.stderr)
        return None


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


def requirement_fields(req):
    if isinstance(req, list):
        fields = []
        for r in req:
            fn = r.get("field_name", "") if isinstance(r, dict) else ""
            if fn:
                fields.append(fn)
        return fields
    if isinstance(req, str):
        if req.startswith("{"):
            try:
                return [k for k in json.loads(req).keys() if isinstance(json.loads(req)[k], (str, int, float))]
            except Exception:
                return []
        return [f.strip() for f in req.split(",")]
    return []


def main():
    print("Fetching subcategory catalogue...", file=sys.stderr)
    subs = fetch_json("catalog/subcategories")
    if not subs:
        sys.exit(1)
    # figure out the shape: list or {data: [...]}
    items = subs if isinstance(subs, list) else subs.get("data", [])
    if not isinstance(items, list) and "data" in subs:
        # nested deeper?
        for k, v in subs.items():
            if isinstance(v, list):
                items = v
                break
    print(f"Got {len(items)} subcategories", file=sys.stderr)

    with open("/tmp/s2s-scanner-found.json", "w") as out:
        found = {}
        for slug, (keywords, req_fields, fake_id) in GAMES.items():
            # candidate subcats matching both name and requirements
            candidates = []
            for item in items:
                name = (item.get("name") or "") + " " + (item.get("big_category_name") or "")
                if not any(kw.lower() in name.lower() for kw in keywords):
                    continue
                fields = requirement_fields(item.get("requirements") or item.get("requirement_fields"))
                # match our expected fields
                need = set(req_fields if req_fields[0] != "player_id, tag" else ["player_id"])
                have = set(fields)
                if need <= have:
                    candidates.append(item)
            print(f"{slug}: {len(candidates)} candidate items", file=sys.stderr)
            winners = []
            tested = 0
            for cand in candidates[:12]:  # cap per game to respect rate limits
                tested += 1
                sid = cand.get("id") or cand.get("sub_category_id")
                if not sid:
                    continue
                res = validate(sid, fake_id)
                err = (res.get("error") or {})
                code = err.get("code")
                # success path: validated true with player echo
                if res.get("success") and isinstance(res.get("data"), dict) and res["data"].get("validated"):
                    code = "VALID"
                status = "VALIDATOR" if code in VALIDATION_CODES or code == "VALID" else (
                    "skip" if code in SKIP_CODES else "unknown")
                print(f"  {status} {slug} subcat {sid} ({(cand.get('name') or '')[:40]}) -> {code}", file=sys.stderr)
                if status == "VALIDATOR":
                    winners.append({"sub_category_id": sid, "name": cand.get("name"),
                                    "category_id": cand.get("category_id"), "code": code,
                                    "requirements": cand.get("requirements")})
                    break  # first validator found is enough
                if tested >= 5 and not winners:
                    break
            found[slug] = winners
        json.dump(found, out, indent=2)
    print("Saved /tmp/s2s-scanner-found.json", file=sys.stderr)


if __name__ == "__main__":
    main()
