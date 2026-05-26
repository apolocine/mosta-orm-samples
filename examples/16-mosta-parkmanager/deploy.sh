#!/bin/bash
#===============================================
# Deploy MostaParkManager to amia.fr
#===============================================
set -e

# --- Configuration ---
APP_NAME="MostaParkManager"
LOCAL_DIR="/home/hmd/dev/MostaGare-Install/MostaParkManager"
REMOTE_USER="hmd"
REMOTE_HOST="amia.fr"
REMOTE_DIR="/home/hmd/www/ws/MostaParkManagerduction"
PM2_NAME="MostaParkManager2"
PORT=4567

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- 1. Sync des fichiers (exclure node_modules, .next, .env*, certificates) ---
log "Syncing files to ${REMOTE_HOST}:${REMOTE_DIR} ..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env*' \
  --exclude 'certificates' \
  --exclude '.git' \
  --exclude 'tsconfig.tsbuildinfo' \
  --exclude 'next-env.d.ts' \
  "${LOCAL_DIR}/" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# --- 2. Commandes distantes ---
log "Running remote setup..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<'REMOTE_SCRIPT'
set -e

APP_DIR="/home/hmd/www/ws/MostaParkManager"
PM2_NAME="MostaParkManager"
PORT=4567

cd "$APP_DIR"

# --- 2a. Creer .env.local si absent ---
if [ ! -f .env.local ]; then
  echo "[DEPLOY] Creating .env.local on server..."
  cat > .env.local <<'ENVEOF'
# Base de données MongoDB
MONGODB_URI=mongodb://devuser:devpass26@localhost:27017/parkmanagerdb_dev
DATABASE_NAME=parkmanagerdb_dev

# NextAuth Configuration (localhost car Apache reverse proxy SSL)
NEXTAUTH_URL=http://localhost:4567
NEXTAUTH_SECRET=MostaParkManagerSecretKey2026xYz9Kl++O7Jl02iOPBJ/jHo=
AUTH_SECRET=MostaParkManagerSecretKey2026xYz9Kl++O7Jl02iOPBJ/jHo=
AUTH_TRUST_HOST=true

# URLs publiques (visibles par le navigateur via Apache)
NEXT_PUBLIC_APP_URL=https://secu.amia.fr

# Environment
NODE_ENV=development
PORT=4567

# API Configuration
API_URL=http://localhost:4567/api

# Application Info
APP_NAME="Mosta ParkManager"
APP_VERSION=1.0.0
ENVEOF
  echo "[DEPLOY] .env.local created. EDIT IT if URLs/DB differ on server!"
else
  echo "[DEPLOY] .env.local already exists, skipping creation."
fi

# --- 2b. Install dependencies ---
echo "[DEPLOY] Installing npm dependencies..."
npm install --legacy-peer-deps

# --- 2c. Stop existing pm2 process if running ---
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  echo "[DEPLOY] Stopping existing pm2 process: $PM2_NAME"
  pm2 stop "$PM2_NAME"
  pm2 delete "$PM2_NAME"
fi

# --- 2d. Start with pm2 ---
echo "[DEPLOY] Starting $PM2_NAME with pm2 on port $PORT..."
pm2 start npm --name "$PM2_NAME" --cwd "$APP_DIR" -- run dev
pm2 save

echo "[DEPLOY] Done! App running at port $PORT"
pm2 status "$PM2_NAME"
REMOTE_SCRIPT

log "Deployment complete!"
log "App: https://amia.fr (port ${PORT} via pm2)"
log "  pm2 logs ${PM2_NAME}  -- voir les logs"
log "  pm2 restart ${PM2_NAME}  -- redemarrer"
