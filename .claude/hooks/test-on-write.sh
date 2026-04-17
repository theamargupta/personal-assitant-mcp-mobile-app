#!/usr/bin/env bash
set -euo pipefail

payload="$(cat || true)"

if ! command -v python3 >/dev/null 2>&1; then
  exit 0
fi

mapfile -t tests < <(python3 - "$payload" <<'PY'
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

for raw in paths:
    path = pathlib.Path(raw)
    normalized = pathlib.PurePosixPath(str(path).replace("\\", "/"))
    if not normalized.parts or normalized.parts[0] != "lib":
        continue
    stem_path = pathlib.Path("__tests__") / path
    candidates = [
        stem_path.with_suffix(".test.ts"),
        stem_path.with_suffix(".test.tsx"),
        stem_path.with_suffix(".spec.ts"),
        stem_path.with_suffix(".spec.tsx"),
    ]
    for candidate in candidates:
        if candidate.exists():
            print(candidate)
            break
PY
)

if [ "${#tests[@]}" -eq 0 ]; then
  exit 0
fi

if [ -x ./node_modules/.bin/jest ]; then
  ./node_modules/.bin/jest "${tests[@]}" || true
else
  npx jest "${tests[@]}" || true
fi

exit 0
