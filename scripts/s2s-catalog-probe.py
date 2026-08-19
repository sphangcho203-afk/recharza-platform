"""Probe Shop2TopUp catalog for our games' categories and validation requirements.

Shop2TopUp rejects non-browser/curl User-Agents (403), so we use a curl UA.
"""

import json
import subprocess
import sys

API = "https://shop2topup.com/api/endpoints/v1"
KEY = "OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V"

HEADERS = ["-H", f"Authorization: Bearer {KEY}", "-A", "Mozilla/5.0 (compatible; Recharza/1.0)"]

TARGETS = [
    ("mobile-legends", ["mobile legends", "mlbb"]),
    ("free-fire", ["free fire", "ff"]),
    ("pubg-mobile", ["pubg mobile"]),
    ("call-of-duty-mobile", ["call of duty mobile", "cod mobile"]),
    ("valorant", ["valorant"]),
    ("genshin-impact", ["genshin"]),
    ("fortnite", ["fortnite"]),
    ("bgmi", ["battlegrounds", "bgmi", "pubg india"]),
    ("wild-rift", ["wild rift"]),
]


def fetch(path, params=""):
    url = f"{API}/{path}{params}"
    r = subprocess.run(
        ["curl", "-s", url, *HEADERS], capture_output=True, text=True, timeout=120
    )
    return json.loads(r.stdout)


def main():
    cats = fetch("catalog/categories")["data"]
    print(f"Total categories: {len(cats)}", file=sys.stderr)

    out = {}
    for slug, substrs in TARGETS:
        hits = [
            c for c in cats
            if any(s in c["name"].lower() for s in substrs)
        ]
        out[slug] = []
        print(f"\n== {slug}: {len(hits)} matching categories ==", file=sys.stderr)
        for c in hits[:6]:
            req = c.get("requirements") or {}
            print(
                f"  id={c['id']} name={c['name']} big={c.get('big_category_name')} "
                f"req={json.dumps(req)[:180]}",
                file=sys.stderr,
            )
            out[slug].append(
                {
                    "category_id": c["id"],
                    "name": c["name"],
                    "big_category_name": c.get("big_category_name"),
                    "requirements": req,
                }
            )

    with open("/tmp/s2s-matched-categories.json", "w") as f:
        json.dump(out, f, indent=2)
    print("\nSaved to /tmp/s2s-matched-categories.json", file=sys.stderr)


if __name__ == "__main__":
    main()
