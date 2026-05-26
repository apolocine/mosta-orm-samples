#!/bin/bash
# Author: Dr Hamid MADANI drmdh@msn.com
# Start @mostajs/net server with MostaParkManager schemas
# Usage: ./start-net.sh [port]
#
# Reads DB_DIALECT, SGBD_URI, DB_SHOW_SQL etc. from .env.local
# (same as @mostajs/orm getConfigFromEnv())
set -euo pipefail

cd "$(dirname "$0")"

# Load .env.local (same file that @mostajs/orm reads)
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi

# Override port if passed as argument
[ -n "${1:-}" ] && export MOSTA_NET_PORT="$1"

# Enable transports if not already set
export MOSTA_NET_REST_ENABLED="${MOSTA_NET_REST_ENABLED:-true}"
export MOSTA_NET_SSE_ENABLED="${MOSTA_NET_SSE_ENABLED:-true}"
export MOSTA_NET_JSONRPC_ENABLED="${MOSTA_NET_JSONRPC_ENABLED:-true}"
export MOSTA_NET_WS_ENABLED="${MOSTA_NET_WS_ENABLED:-true}"

exec npx tsx net-server.mjs
