"""Find Shop2TopUp MLBB subcategories and probe player validation on them."""

import json
import subprocess

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]


def fetch(params):
    url = f"{API}/catalog/subcategories?{params}"
    r = subprocess.run(["curl", "-s", url, *HDRS], capture_output=True, text=True, timeout=120)
    return json.loads(r.stdout)


def validate(subcat, body):
    r = subprocess.run(
        [
            "curl", "-s", "-X", "POST",
            f"{API}/player/validate",
            *HDRS, "-H", "Content-Type: application/json",
            "-d", json.dumps(body),
        ],
        capture_output=True, text=True, timeout=120,
    )
    return json.loads(r.stdout)


mlbb = fetch("category_id=474")["data"]
print(f"MLBB subcategories: {len(mlbb)}")
for s in mlbb[:5]:
    print(s["id"], s["name"], s["price"], s.get("conditions"))

# Try validation on first MLBB subcategory (direct topup item id=1) with a fake ID
res = validate(1, {"sub_category_id": 1, "player_id": "285266950", "zone_id": "2013"})
print("\nValidate subcat 1 with fake ID:", json.dumps(res)[:300])

# Try same endpoint shape with player_name-style fields to discover expected requirement names
res2 = validate(1, {"sub_category_id": 1})
print("Validate subcat 1 empty body:", json.dumps(res2)[:300])
