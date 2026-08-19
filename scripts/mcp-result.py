"""Print a captured MCP run_sql result as plain rows."""

import json
import re
import sys

path = sys.argv[1]
d = json.load(open(path))

def walk(o):
    if isinstance(o, dict):
        if "resultFilePath" in o:
            try:
                inner = json.load(open(o["resultFilePath"]))
                walk(inner)
                return
            except Exception:
                pass
        for v in o.values():
            walk(v)
    elif isinstance(o, str):
        # try JSON-ish content
        print(o[:2000])

walk(d)
