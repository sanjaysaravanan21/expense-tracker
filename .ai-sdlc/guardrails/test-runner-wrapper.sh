#!/usr/bin/env bash
# Runs a test/lint command with a timeout and without secrets in the environment.
# Usage: .ai-sdlc/guardrails/test-runner-wrapper.sh npm run test -- --run
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <command...>" >&2
  exit 64
fi

TIMEOUT="${AI_SDLC_TEST_TIMEOUT:-300}"
CLEAN_ENV=(env -i HOME="$HOME" PATH="$PATH" CI=1 NODE_ENV=test TERM=dumb)

# macOS has no `timeout` by default; use it when available, otherwise run unbounded with a warning.
if command -v timeout >/dev/null 2>&1; then
  exec timeout "$TIMEOUT" "${CLEAN_ENV[@]}" "$@"
elif command -v gtimeout >/dev/null 2>&1; then
  exec gtimeout "$TIMEOUT" "${CLEAN_ENV[@]}" "$@"
else
  echo "warning: no timeout binary found; running without a time limit" >&2
  exec "${CLEAN_ENV[@]}" "$@"
fi
