#!/bin/bash
# Usage: neon-sql.sh <sql> [outfile]
SQL="$1"
OUT="${2:-/dev/stdout}"
res=$(manus-mcp-cli tool call run_sql --server neon --input "{\"projectId\":\"solitary-lake-08821205\",\"branchName\":\"main\",\"sql\":\"$SQL\"}" 2>/dev/null)
path=$(echo "$res" | grep -o "resultFilePath\": *\"[^\"]*\"" | head -1 | grep -o "http[^\"]*" | sed 's|file://||')
if [ -n "$path" ] && [ -f "$path" ]; then
  cp "$path" "$OUT"
else
  # find most recent file in tool-results
  newest=$(ls -t /home/ubuntu/.mcp/tool-results/ | grep -v list_projects | head -1)
  if [ -n "$newest" ]; then cp "/home/ubuntu/.mcp/tool-results/$newest" "$OUT"; fi
fi
cat "$OUT"
