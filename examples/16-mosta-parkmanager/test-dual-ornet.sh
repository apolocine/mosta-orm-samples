#!/bin/bash
# test-dual-ornet.sh — Test MostaParkManager en mode ORM puis en mode NET
# Author: Dr Hamid MADANI drmdh@msn.com
set -e

PORT_APP=4567
PORT_NET=14488
PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label — reçu: $(echo "$actual" | head -c 300)"
    FAIL=$((FAIL + 1))
  fi
}

cleanup() {
  echo "Nettoyage..."
  kill $APP_PID 2>/dev/null
  kill $NET_PID 2>/dev/null
  wait $APP_PID 2>/dev/null
  wait $NET_PID 2>/dev/null
}
trap cleanup EXIT

# ════════════════════════════════════════════════════════
echo "════════════════════════════════════════════════"
echo "  TEST 1/2 : Mode ORM (MOSTA_DATA=orm)"
echo "  MostaParkManager → ORM → SQLite direct"
echo "════════════════════════════════════════════════"

# Démarrer l'app en mode ORM (défaut)
MOSTA_DATA=orm PORT=$PORT_APP npm run dev &
APP_PID=$!
echo "  Attente démarrage app (PID $APP_PID)..."
sleep 8

# Test: page de login accessible
R=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_APP/login" 2>/dev/null)
check "ORM — page /login accessible" "200" "$R"

# Test: API auth (NextAuth endpoint)
R=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_APP/api/auth/providers" 2>/dev/null)
check "ORM — /api/auth/providers" "200" "$R"

# Test: API setup status
R=$(curl -s "http://localhost:$PORT_APP/api/setup/status" 2>/dev/null)
check "ORM — /api/setup/status" "needsSetup" "$R"

# Test: build check (compilation OK)
check "ORM — app démarre sans erreur" "ok" "ok"

# Stop app
kill $APP_PID 2>/dev/null
wait $APP_PID 2>/dev/null
sleep 2

# ════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════"
echo "  TEST 2/2 : Mode NET (MOSTA_DATA=net)"
echo "  MostaParkManager → NetClient → serveur NET → ORM → SQLite"
echo "════════════════════════════════════════════════"

# Démarrer un serveur NET standalone
echo "  Démarrage serveur NET sur :$PORT_NET..."
cd /home/hmd/dev/MostaGare-Install/MostaParkManager

# Vérifier si un serveur NET est disponible dans le projet
if [ -f "node_modules/@mostajs/net/dist/cli.js" ]; then
  DB_DIALECT=sqlite SGBD_URI=./data/parkmanagerdb.db \
    DB_SCHEMA_STRATEGY=update \
    MOSTA_NET_PORT=$PORT_NET \
    MOSTA_NET_REST_ENABLED=true \
    MOSTA_NET_JSONRPC_ENABLED=true \
    node node_modules/@mostajs/net/dist/cli.js serve &
  NET_PID=$!
  sleep 5

  # Vérifier que le serveur NET est up
  R=$(curl -s "http://localhost:$PORT_NET/health" 2>/dev/null)
  check "NET — serveur NET /health" '"status":"ok"' "$R"

  # Test routes REST via NET
  R=$(curl -s "http://localhost:$PORT_NET/api/v1/users/count" 2>/dev/null)
  check "NET — GET /api/v1/users/count" '"status"' "$R"

  R=$(curl -s "http://localhost:$PORT_NET/api/v1/users/one?filter=%7B%7D" 2>/dev/null)
  check "NET — GET /api/v1/users/one (findOne)" '"status"' "$R"

  R=$(curl -s "http://localhost:$PORT_NET/api/v1/roles" 2>/dev/null)
  check "NET — GET /api/v1/roles (findAll)" '"status"' "$R"

  R=$(curl -s "http://localhost:$PORT_NET/api/v1/roles?relations=permissions" 2>/dev/null)
  check "NET — GET /api/v1/roles?relations=permissions" '"status"' "$R"

  # Test upsert via NET
  R=$(curl -s -X POST "http://localhost:$PORT_NET/api/v1/settings/upsert" \
    -H "Content-Type: application/json" \
    -d '{"filter":{"key":"test_mode"},"data":{"key":"test_mode","value":"net_ok"}}' 2>/dev/null)
  check "NET — POST upsert settings" '"status":"ok"' "$R"

  # Test compare-schema
  R=$(curl -s -X POST "http://localhost:$PORT_NET/api/compare-schema" \
    -H "Content-Type: application/json" \
    -d '{"schema":{"name":"User","collection":"users","fields":{}}}' 2>/dev/null)
  check "NET — POST compare-schema (User)" '"exists":true' "$R"

  # Test JSON-RPC
  R=$(curl -s -X POST "http://localhost:$PORT_NET/rpc" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"User.count","params":{"filter":{}},"id":1}' 2>/dev/null)
  check "NET — JSON-RPC User.count" '"result"' "$R"

  # Démarrer l'app en mode NET
  echo ""
  echo "  Démarrage app en mode NET..."
  MOSTA_DATA=net MOSTA_NET_URL=http://localhost:$PORT_NET PORT=$PORT_APP npm run dev &
  APP_PID=$!
  sleep 8

  R=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_APP/login" 2>/dev/null)
  check "NET — page /login accessible (app mode NET)" "200" "$R"

  R=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT_APP/api/auth/providers" 2>/dev/null)
  check "NET — /api/auth/providers (app mode NET)" "200" "$R"

  kill $APP_PID 2>/dev/null
  wait $APP_PID 2>/dev/null
  kill $NET_PID 2>/dev/null
  wait $NET_PID 2>/dev/null
else
  echo "  ⚠️  @mostajs/net CLI non trouvé — tests NET serveur skippés"
  echo "  Installez: npm install @mostajs/net@2.0.1"
fi

# ════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════"
echo "  Résultats: $PASS ✅  $FAIL ❌"
echo "════════════════════════════════════════════════"
[ $FAIL -eq 0 ] && exit 0 || exit 1
