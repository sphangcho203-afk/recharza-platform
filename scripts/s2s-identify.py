"""Identify the validator sub_category_ids found in range-probe by name."""

import json
import subprocess

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"

found = json.load(open("/tmp/s2s-range-found.json"))
r = subprocess.run(["curl", "-s", f"{API}/catalog/subcategories",
                    "-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"],
                   capture_output=True, text=True, timeout=120)
d = json.loads(r.stdout)
items = d if isinstance(d, list) else d.get("data", [])
by_id = {i["id"]: i for i in items}

rows = []
for sid in sorted(int(k) for k in found):
    it = by_id.get(sid)
    name = it["name"] if it else "UNKNOWN"
    cat = it["category_name"] if it else ""
    reqs = None
    if it:
        # fetch per-item requirements from category requirements endpoint instead
        reqs = f"cat:{it['category_id']}"
    rows.append({"id": sid, "name": name, "category": cat, "cat_id": it["category_id"] if it else None})
    print(sid, "|", cat, "|", name, "|", reqs)

json.dump(rows, open("/tmp/s2s-identified.json", "w"), indent=2)
