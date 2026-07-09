#!/usr/bin/env bash
# Dev server launcher for the Deno registry app.
#
# The v0 preview runs `npm run dev` and watches $DEV_PORT. Deno is provided by
# the `deno` npm package (a devDependency), so it's installed automatically as
# part of `npm install` on every restart -- no curl bootstrap and nothing
# gitignored that gets wiped on a cold start. We just launch the combined
# server (deno/main.tsx) on $DEV_PORT.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Prefer the npm-provided binary; fall back to a PATH deno for local shells.
DENO_BIN="$ROOT/node_modules/.bin/deno"
if [ ! -x "$DENO_BIN" ]; then
  DENO_BIN="$(command -v deno || true)"
fi
if [ -z "${DENO_BIN:-}" ] || [ ! -x "$DENO_BIN" ]; then
  echo "[dev] Deno binary not found. Run \`npm install\` first." >&2
  exit 1
fi

# Keep the module cache inside node_modules so it survives alongside deps and is
# warmed by the postinstall `deno cache` step (fast startup, no re-download).
export DENO_DIR="${DENO_DIR:-$ROOT/node_modules/.cache/deno}"

# Load project env (VAL_TOWN_API_KEY, YJS_URL, etc.) if present.
if [ -f "$ROOT/.env.development.local" ]; then
  set -a && . "$ROOT/.env.development.local" && set +a
fi

export DEV_PORT="${DEV_PORT:-5173}"

# The combined server mounts every sub-app under one origin, so point the
# cross-service links at local relative paths instead of the production
# *.val.run URLs (which the preview iframe blocks). These match the mounts in
# deno/main.tsx: /zon, /file, and / for the gallery.
export URL_ZONS="${URL_ZONS:-/}"
export URL_ZON="${URL_ZON:-/zon}"
export URL_FILES="${URL_FILES:-/file}"

echo "[dev] Starting Deno registry server on port $DEV_PORT ..."
# NOTE: no --watch. A churning deno/node_modules/.deno.lock.poll file makes the
# Deno watcher restart in an endless loop here (even with --watch-exclude), so
# the server is launched once. Restart the dev task to pick up code changes.
exec "$DENO_BIN" run -A "$ROOT/deno/main.tsx"
