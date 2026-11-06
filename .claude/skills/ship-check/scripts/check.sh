#!/usr/bin/env bash
# Pre-commit / pre-push gate. Runs each stage separately so an early failure
# does not hide a later one, and exits non-zero if any stage failed.
set -uo pipefail

failed=0

run_stage() {
  local name="$1"; shift
  echo "=== $name ==="
  if output=$("$@" 2>&1); then
    echo "PASS: $name"
    echo "$output" | tail -n 3
  else
    failed=1
    echo "FAIL: $name"
    echo "$output" | tail -n 40
  fi
  echo
}

# `npm run build` already runs `astro check` first, so a green build covers the
# typecheck. astro check runs on its own too so a type error is reported even
# when the build never gets past it.
run_stage "typecheck (astro check)" npx astro check
run_stage "build (astro check + astro build)" npm run build
run_stage "compliance" node .claude/skills/compliance-check/scripts/check.mjs

echo "=== summary ==="
if [ "$failed" -eq 0 ]; then
  echo "All stages PASS."
else
  echo "At least one stage FAILED. Do not commit or push until all pass."
fi
exit "$failed"
