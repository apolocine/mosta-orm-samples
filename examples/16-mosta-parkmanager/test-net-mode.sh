#!/bin/bash
# test-net-mode.sh — Génère schemas.json puis teste le mode NET pour MostaParkManager
# Author: Dr Hamid MADANI drmdh@msn.com
set -e

PORT_NET=14488
SCHEMAS_DIR="./src/dal/schemas"
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

# Nettoyage au exit
cleanup() { kill $NET_PID 2>/dev/null; wait $NET_PID 2>/dev/null; }
trap cleanup EXIT

# Tuer tout process sur le port
lsof -ti:$PORT_NET | xargs kill 2>/dev/null || true; sleep 1

echo "════════════════════════════════════════════════"
echo "  Étape 1 : Générer schemas.json via NET"
echo "  SCHEMAS_PATH=$SCHEMAS_DIR"
echo "════════════════════════════════════════════════"

# Lancer NET avec SCHEMAS_PATH — il scanne et génère schemas.json automatiquement
DB_DIALECT=sqlite SGBD_URI=./data/parkmanagerdb.db \
  DB_SCHEMA_STRATEGY=update \
  SCHEMAS_PATH=$SCHEMAS_DIR \
  MOSTA_NET_PORT=$PORT_NET \
  MOSTA_NET_REST_ENABLED=true \
  MOSTA_NET_JSONRPC_ENABLED=true \
  node node_modules/@mostajs/net/dist/cli.js serve &
NET_PID=$!
sleep 5

# Vérifier que schemas.json a été généré
if [ -f schemas.json ]; then
  SCHEMA_COUNT=$(python3 -c "import json; print(len(json.load(open('schemas.json'))))")
  echo "  ✅ schemas.json généré ($SCHEMA_COUNT schemas)"
  PASS=$((PASS + 1))
else
  echo "  ❌ schemas.json non généré"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "════════════════════════════════════════════════"
echo "  Étape 2 : Tests REST (16 opérations)"
echo "════════════════════════════════════════════════"

# health
R=$(curl -s "http://localhost:$PORT_NET/health")
check "health" '"status":"ok"' "$R"

# count entities
R=$(curl -s "http://localhost:$PORT_NET/api/v1/users/count")
check "users count" '"status"' "$R"

# findAll
R=$(curl -s "http://localhost:$PORT_NET/api/v1/roles")
check "findAll roles" '"status":"ok"' "$R"

# findAll + select
R=$(curl -s "http://localhost:$PORT_NET/api/v1/roles?select=name,description")
check "findAll+select" '"status":"ok"' "$R"

# findAll + exclude
R=$(curl -s "http://localhost:$PORT_NET/api/v1/users?exclude=password")
check "findAll+exclude" '"status":"ok"' "$R"

# findAll + relations
R=$(curl -s "http://localhost:$PORT_NET/api/v1/roles?relations=permissions")
check "findAll+relations" '"status":"ok"' "$R"

# findOne
R=$(curl -s "http://localhost:$PORT_NET/api/v1/users/one?filter=%7B%7D")
check "findOne user" '"status":"ok"' "$R"

# create
R=$(curl -s -X POST "http://localhost:$PORT_NET/api/v1/permission_categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"test_dual","label":"Test Dual","order":99}')
check "create" '"status":"ok"' "$R"
CREATED_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# findById
if [ -n "$CREATED_ID" ]; then
  R=$(curl -s "http://localhost:$PORT_NET/api/v1/permission_categories/$CREATED_ID")
  check "findById" '"status":"ok"' "$R"
fi

# update
if [ -n "$CREATED_ID" ]; then
  R=$(curl -s -X PUT "http://localhost:$PORT_NET/api/v1/permission_categories/$CREATED_ID" \
    -H "Content-Type: application/json" \
    -d '{"label":"Test Dual Updated"}')
  check "update" '"status":"ok"' "$R"
fi

# upsert
R=$(curl -s -X POST "http://localhost:$PORT_NET/api/v1/settings/upsert" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"key":"dual_net_test"},"data":{"key":"dual_net_test","value":"ok"}}')
check "upsert settings" '"status":"ok"' "$R"

# deleteMany
R=$(curl -s -X DELETE "http://localhost:$PORT_NET/api/v1/settings/bulk" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"key":"dual_net_test"}}')
check "deleteMany" '"status"' "$R"

# delete
if [ -n "$CREATED_ID" ]; then
  R=$(curl -s -X DELETE "http://localhost:$PORT_NET/api/v1/permission_categories/$CREATED_ID")
  check "delete" '"status":"ok"' "$R"
fi

# compare-schema
R=$(curl -s -X POST "http://localhost:$PORT_NET/api/compare-schema" \
  -H "Content-Type: application/json" \
  -d '{"schema":{"name":"User","collection":"users","fields":{}}}')
check "compareSchema (exists)" '"exists":true' "$R"

R=$(curl -s -X POST "http://localhost:$PORT_NET/api/compare-schema" \
  -H "Content-Type: application/json" \
  -d '{"schema":{"name":"FakeEntity","collection":"fakes","fields":{}}}')
check "compareSchema (not exists)" '"exists":false' "$R"

echo ""
echo "════════════════════════════════════════════════"
echo "  Étape 3 : Tests JSON-RPC"
echo "════════════════════════════════════════════════"

R=$(curl -s -X POST "http://localhost:$PORT_NET/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"User.count","params":{"filter":{}},"id":1}')
check "jsonrpc User.count" '"result"' "$R"

R=$(curl -s -X POST "http://localhost:$PORT_NET/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"Role.findAll","params":{"filter":{}},"id":2}')
check "jsonrpc Role.findAll" '"result"' "$R"

R=$(curl -s -X POST "http://localhost:$PORT_NET/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"User.findOne","params":{"filter":{}},"id":3}')
check "jsonrpc User.findOne" '"result"' "$R"

R=$(curl -s -X POST "http://localhost:$PORT_NET/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"Setting.upsert","params":{"filter":{"key":"rpc_test"},"data":{"key":"rpc_test","value":"hello"}},"id":4}')
check "jsonrpc Setting.upsert" '"result"' "$R"

# Nettoyage du upsert test
curl -s -X POST "http://localhost:$PORT_NET/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"Setting.deleteMany","params":{"filter":{"key":"rpc_test"}},"id":5}' > /dev/null

echo ""
echo "════════════════════════════════════════════════"
echo "  Résultats: $PASS ✅  $FAIL ❌"
echo "════════════════════════════════════════════════"
[ $FAIL -eq 0 ] && exit 0 || exit 1
