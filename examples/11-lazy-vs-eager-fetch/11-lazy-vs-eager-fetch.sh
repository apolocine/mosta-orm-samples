#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "─── Installing dependencies (first run) ───"
  npm install --silent --no-audit --no-fund
fi

rm -f lazy.db eager.db
npx -y tsx app.ts
