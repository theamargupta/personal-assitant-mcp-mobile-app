#!/usr/bin/env bash
set -euo pipefail

payload="$(cat || true)"

if ! command -v python3 >/dev/null 2>&1; then
  exit 0
fi

python3 - "$payload" <<'PY'
import json
import re
import sys

payload = sys.argv[1]

try:
    data = json.loads(payload) if payload.strip() else {}
except json.JSONDecodeError:
    data = {}

command = (
    data.get("tool_input", {}).get("command")
    or data.get("tool_input", {}).get("cmd")
    or data.get("command")
    or data.get("cmd")
    or payload
)

if not isinstance(command, str):
    sys.exit(0)

is_git_commit = re.search(r"(^|&&|\|\||;)\s*git\s+commit\b", command) is not None
mentions_env = re.search(r"(^|\s)(\.env[^\s]*|.*\.env[^\s]*)($|\s)", command) is not None

if is_git_commit and mentions_env:
    print("Blocked: do not commit .env files or credentials.", file=sys.stderr)
    sys.exit(2)

sys.exit(0)
PY
