#!/bin/bash
# launchd entry point for the crawl automation.
#
# launchd gives a job a minimal environment: no nvm, no Homebrew, no shell
# profile. Everything the run needs on PATH is set here explicitly.
set -euo pipefail

# Newest installed nvm node, so a node upgrade does not silently break the job.
NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1 || true)"
export PATH="${NODE_BIN}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

if ! command -v node >/dev/null 2>&1; then
  echo "$(date -u +%FT%TZ) FATAL: node not found on PATH ($PATH)" >&2
  exit 127
fi

echo "$(date -u +%FT%TZ) starting nightly crawl (node $(node -v))"
exec npx tsx scripts/crawl/nightly.ts
