#!/usr/bin/env bash
# Dev server launcher for the Deno registry app.
#
# The v0 preview runs `npm run dev` and watches $DEV_PORT. Deno isn't part of
# the Node toolchain and its global install ($HOME/.deno) doesn't survive
# sandbox resets, so we bootstrap a project-local copy under ./.deno (which is
# gitignored) and run the combined server (deno/main.tsx) on $DEV_PORT.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export DENO_INSTALL="$ROOT/.deno"
DENO_BIN="$DENO_INSTALL/bin/deno"

# Load project env (VAL_TOWN_API_KEY, YJS_URL, etc.) if present.
if [ -f "$ROOT/.env.development.local" ]; then
  set -a && . "$ROOT/.env.development.local" && set +a
fi

# Install Deno locally if it's not already there.
if [ ! -x "$DENO_BIN" ]; then
  echo "[dev] Deno not found, installing to $DENO_INSTALL ..."
  curl -fsSL https://deno.land/install.sh | sh -s -- -y >/dev/null 2>&1
fi

export PATH="$DENO_INSTALL/bin:$PATH"
export DEV_PORT="${DEV_PORT:-5173}"

# The combined server mounts every sub-app under one origin, so point the
# cross-service links at local relative paths instead of the production
# *.val.run URLs (which the preview iframe blocks). These match the mounts in
# deno/main.tsx: /zon, /file, and / for the gallery.
export URL_ZONS="${URL_ZONS:-/}"
export URL_ZON="${URL_ZON:-/zon}"
export URL_FILES="${URL_FILES:-/file}"

echo "[dev] Starting Deno registry server on port $DEV_PORT ..."
exec "$DENO_BIN" run -A "$ROOT/deno/main.tsx"
