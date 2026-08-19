import json
import sys

path = sys.argv[1]
d = json.load(open(path))


def deep(o, seen=0):
    if isinstance(o, dict):
        if o.get("resultFilePath") and seen < 5:
            try:
                return deep(json.load(open(o["resultFilePath"])), seen + 1)
            except Exception:
                pass
        if "resultPreview" in o:
            return o["resultPreview"]
        if "text" in o and isinstance(o["text"], str) and len(o["text"]) > 50:
            return o["text"]
        for v in o.values():
            r = deep(v, seen)
            if r is not None:
                return r
    if isinstance(o, list):
        for v in o:
            r = deep(v, seen)
            if r is not None:
                return r
    return None


print(deep(d)[:4000])
