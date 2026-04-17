#!/usr/bin/env bash
set -euo pipefail

payload="$(cat || true)"

if ! command -v python3 >/dev/null 2>&1; then
  exit 0
fi

python3 - "$payload" <<'PY'
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

content_parts = []
for key in ("content", "new_string", "old_string"):
    value = tool_input.get(key)
    if isinstance(value, str):
        content_parts.append(value)

for item in tool_input.get("edits", []) if isinstance(tool_input.get("edits"), list) else []:
    if isinstance(item, dict):
        for key in ("content", "new_string", "old_string"):
            value = item.get(key)
            if isinstance(value, str):
                content_parts.append(value)

content = "\n".join(content_parts)
needles = ("service_role", "SUPABASE_SERVICE_ROLE_KEY")

def in_mobile_code(path: str) -> bool:
    normalized = pathlib.PurePosixPath(path.replace("\\", "/"))
    parts = normalized.parts
    return "app" in parts or "lib" in parts

if any(needle in content for needle in needles) and any(in_mobile_code(path) for path in paths):
    print("Blocked: Supabase service-role keys must not appear in mobile app/lib code.", file=sys.stderr)
    sys.exit(2)

sys.exit(0)
PY
