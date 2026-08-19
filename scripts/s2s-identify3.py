"""Fetch subcategories with offset to identify ids 101-119 by name."""

import json
import subprocess

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

for params in ["?offset=99&limit=25", "?page=2", "?skip=99"]:
    r = subprocess.run(["curl", "-s", f"{API}/catalog/subcategories{params}", *HDRS],
                       capture_output=True, text=True, timeout=120)
    try:
        d = json.loads(r.stdout)
    except Exception:
        print(f"{params}: fetch failed {r.stdout[:80]}")
        continue
    items = d if isinstance(d, list) else d.get("data", [])
    if not isinstance(items, list) or not items:
        print(f"{params}: empty/odd shape ({json.dumps(d)[:120]})")
        continue
    hits = [i for i in items if 95 <= i["id"] <= 125]
    print(f"{params}: got {len(items)} items, hits in 95-125: {len(hits)}")
    for h in hits:
        print(f"  {h['id']} | {h.get('category_name')} | {h['name']}")
    if hits:
        break
