import json
import subprocess

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"
HDRS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0"]

r = subprocess.run(["curl", "-s", f"{API}/catalog/subcategories", *HDRS],
                   capture_output=True, text=True, timeout=120)
d = json.loads(r.stdout)
items = d if isinstance(d, list) else d.get("data", [])
print("shape sample item keys:", sorted(items[0].keys()))
print(json.dumps(items[0], indent=2)[:1200])
# names present
names = {i.get("name"): i.get("big_category_name") for i in items[:500]}
with open("/tmp/s2s-names.txt", "w") as f:
    for n, b in sorted(set((k or "", v or "") for k, v in names.items())):
        f.write(f"{b} :: {n}\n")
print("saved /tmp/s2s-names.txt")
