#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "─── Installing dependencies (first run) ───"
  npm install --silent --no-audit --no-fund
fi

npx -y tsx app.ts
