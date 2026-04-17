#!/usr/bin/env bash
set -euo pipefail

payload="$(cat || true)"

if ! command -v python3 >/dev/null 2>&1; then
  exit 0
fi

mapfile -t files < <(python3 - "$payload" <<'PY'
import json
import pathlib
import sys

payload = sys.argv[1]
try:
    data = json.loads(payload) if payload.strip() else {}
except json.JSONDecodeError:
    data = {}

tool_input = data.get("tool_input", {}) if isinstance(data, dict) else {}
paths = []
for key in ("file_path", "path"):
    value = tool_input.get(key)
    if isinstance(value, str):
        paths.append(value)

for item in tool_input.get("edits", []) if isinstance(tool_input.get("edits"), list) else []:
    value = item.get("file_path") if isinstance(item, dict) else None
    if isinstance(value, str):
        paths.append(value)

seen = set()
for raw in paths:
    path = pathlib.Path(raw)
    if path.suffix not in {".ts", ".tsx"}:
        continue
    text = str(path)
    if text not in seen and path.exists():
        seen.add(text)
        print(text)
PY
)

if [ "${#files[@]}" -eq 0 ]; then
  exit 0
fi

if [ -x ./node_modules/.bin/eslint ]; then
  ./node_modules/.bin/eslint "${files[@]}" || true
elif command -v npx >/dev/null 2>&1; then
  npx eslint "${files[@]}" || true
fi

exit 0
