#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# ─── Install deps if missing ───
if [ ! -d node_modules ]; then
  echo "─── Installing dependencies (first run) ───"
  npm install --silent --no-audit --no-fund
fi

# ─── Reset DB for clean re-run ───
rm -f app.db

# ─── Run sample ───
npx -y tsx app.ts

# ─── Verify file artefact ───
if [ ! -f app.db ]; then
  echo "❌ app.db not created"
  exit 1
fi

echo "✓ app.db présent ($(stat -c %s app.db) bytes)"
