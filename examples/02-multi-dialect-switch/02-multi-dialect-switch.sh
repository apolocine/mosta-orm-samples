#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "─── Installing dependencies (first run) ───"
  npm install --silent --no-audit --no-fund
fi

# Reset only the local SQLite (les Postgres/MySQL externes ne sont pas reset ici)
rm -f app.db

npx -y tsx app.ts
