#!/usr/bin/env bash
# Mosta ParkManager — sample 16 (showcase end-to-end @mostajs/*)
# Démarre l'app Next.js après installation des dépendances + seed.
# Author: Dr Hamid MADANI <drmdh@msn.com>
set -e
cd "$(dirname "$0")"

# 1) Dépendances — --legacy-peer-deps requis tant que l'écosystème mostajs/*
#    n'aligne pas ses peer-deps cross-modules (rbac/audit notamment).
if [ ! -d node_modules ]; then
  echo "─── Installing dependencies (first run, --legacy-peer-deps) ───"
  npm install --legacy-peer-deps --no-audit --no-fund
fi

# 2) .env.local
if [ ! -f .env.local ]; then
  echo "─── Creating .env.local from .env.example ───"
  cp .env.example .env.local
  # Génère un NEXTAUTH_SECRET aléatoire
  SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
  sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$SECRET|" .env.local
  sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=$SECRET|" .env.local
fi

# 3) Affichage du contexte DB courant — lit .env.local pour info utilisateur.
DIALECT=$(grep -E "^DB_DIALECT=" .env.local | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
SGBD_URI=$(grep -E "^SGBD_URI=" .env.local | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

echo ""
echo "─── Configuration courante (.env.local) ───"
echo "  Dialect : ${DIALECT:-(non défini)}"
echo "  URI     : ${SGBD_URI:-(non défini)}"

# État DB selon dialect (sans connexion, juste check d'existence)
DB_STATUS="(inconnu)"
case "$DIALECT" in
  sqlite)
    DB_FILE=$(echo "$SGBD_URI" | sed 's|^\./||; s|^sqlite://||')
    if [ -f "$DB_FILE" ]; then
      SIZE=$(stat -c%s "$DB_FILE" 2>/dev/null || stat -f%z "$DB_FILE" 2>/dev/null)
      DB_STATUS="existe ($SIZE octets)"
    else
      DB_STATUS="vierge — sera créée"
    fi
    ;;
  mongodb)
    DB_STATUS="connexion Mongo à valider au boot"
    ;;
  *)
    DB_STATUS="check ignoré pour ce dialect"
    ;;
esac
echo "  DB      : $DB_STATUS"
echo ""

# 3.5) Modification optionnelle de la config DB (interactif TTY uniquement,
#      sauf si DB_CONFIG_LOCK=1 en env).
if [ -z "${DB_CONFIG_LOCK:-}" ] && [ -t 0 ]; then
  read -r -p "Modifier la configuration DB (dialect/URI) ? [o/N] : " change
  if [[ "$change" =~ ^[OoYy] ]]; then
    echo ""
    echo "─── Dialects supportés (exemples d'URI) ───"
    echo "  1) sqlite     ./data/parkmanager.db                                                (zero-config, fichier local)"
    echo "  2) mongodb    mongodb://localhost:27017/parkmanagerdb                              (sans auth)"
    echo "                mongodb://devuser:devpass26@localhost:27017/parkmanagerdb?authSource=admin   (avec auth)"
    echo "  3) postgres   postgres://devuser:devpass26@localhost:5432/parkmanagerdb"
    echo "  4) mysql      mysql://devuser:devpass26@localhost:3306/parkmanagerdb"
    echo "  5) mariadb    mariadb://devuser:devpass26@localhost:3306/parkmanagerdb"
    echo "  6) oracle     oracle://devuser:devpass26@localhost:1521/XEPDB1"
    echo ""
    read -r -p "Choisir dialect [1-6] (Entrée pour garder « $DIALECT ») : " choice

    case "$choice" in
      1) NEW_DIALECT=sqlite   ; EXAMPLE_URI="./data/parkmanager.db" ;;
      2) NEW_DIALECT=mongodb  ; EXAMPLE_URI="mongodb://localhost:27017/parkmanagerdb" ;;
      3) NEW_DIALECT=postgres ; EXAMPLE_URI="postgres://devuser:devpass26@localhost:5432/parkmanagerdb" ;;
      4) NEW_DIALECT=mysql    ; EXAMPLE_URI="mysql://devuser:devpass26@localhost:3306/parkmanagerdb" ;;
      5) NEW_DIALECT=mariadb  ; EXAMPLE_URI="mariadb://devuser:devpass26@localhost:3306/parkmanagerdb" ;;
      6) NEW_DIALECT=oracle   ; EXAMPLE_URI="oracle://devuser:devpass26@localhost:1521/XEPDB1" ;;
      "")
        NEW_DIALECT="$DIALECT"
        EXAMPLE_URI="$SGBD_URI"
        ;;
      *)
        echo "Choix invalide, on garde « $DIALECT »"
        NEW_DIALECT="$DIALECT"
        EXAMPLE_URI="$SGBD_URI"
        ;;
    esac

    echo ""
    echo "URI exemple pour $NEW_DIALECT :"
    echo "  $EXAMPLE_URI"
    read -r -p "Nouvelle URI (Entrée pour utiliser l'exemple ci-dessus) : " NEW_URI
    NEW_URI="${NEW_URI:-$EXAMPLE_URI}"

    # Persist dans .env.local — sed avec délimiteur # pour permettre / et : dans URI
    sed -i "s#^DB_DIALECT=.*#DB_DIALECT=$NEW_DIALECT#" .env.local
    sed -i "s#^SGBD_URI=.*#SGBD_URI=$NEW_URI#" .env.local

    DIALECT="$NEW_DIALECT"
    SGBD_URI="$NEW_URI"

    echo ""
    echo "✓ .env.local mis à jour :"
    echo "    DB_DIALECT=$DIALECT"
    echo "    SGBD_URI=$SGBD_URI"
    echo ""
  fi

  # 3.6) Préfixe des tables — recommandé sur Oracle/MSSQL/HANA (schéma = user)
  CURRENT_PREFIX=$(grep -E "^DB_TABLE_PREFIX=" .env.local | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  echo "─── Préfixe des tables (DB_TABLE_PREFIX) ───"
  echo "  Actuel : ${CURRENT_PREFIX:-(non défini)}"
  case "$DIALECT" in
    oracle|mssql|hana)
      echo "  ⚠  Recommandé sur $DIALECT (schéma SQL = user de connexion)"
      echo "     Plusieurs apps avec le même user partagent les mêmes tables."
      ;;
    *)
      echo "  (optionnel sur $DIALECT — DB dédiée par défaut)"
      ;;
  esac
  read -r -p "Définir/modifier le préfixe ? Ex. mp_ (Entrée pour garder « ${CURRENT_PREFIX:-aucun} ») : " NEW_PREFIX
  if [ -n "$NEW_PREFIX" ]; then
    # Crée la ligne si absente, sinon update
    if grep -qE "^#*DB_TABLE_PREFIX=" .env.local; then
      sed -i "s#^#*DB_TABLE_PREFIX=.*#DB_TABLE_PREFIX=$NEW_PREFIX#" .env.local
    else
      echo "DB_TABLE_PREFIX=$NEW_PREFIX" >> .env.local
    fi
    echo "  ✓ DB_TABLE_PREFIX=$NEW_PREFIX"
  elif [ -n "$CURRENT_PREFIX" ]; then
    echo "  → préfixe conservé : $CURRENT_PREFIX"
  else
    echo "  → pas de préfixe (tables aux noms bruts : users, clients, …)"
  fi
  echo ""
fi

# 4) Seed — interactif si TTY, sinon seed:admin par défaut.
#    Mode non-interactif via SEED_LEVEL=full|admin|skip.
#    Tous les seeds sont idempotents (skip si déjà chargés).
SEED_LEVEL="${SEED_LEVEL:-}"

if [ -z "$SEED_LEVEL" ] && [ -t 0 ]; then
  echo "─── Données initiales ───"
  echo "  Y  Seed complet : admin + 3 users + 12 activités + 10 clients + 3 plans + 80 casiers + 10 RFID"
  echo "  a  Admin seulement (DB vierge à part le compte admin)"
  echo "  s  Skip (DB déjà seedée — démarrage direct)"
  read -r -p "Choix [Y/a/s] : " ans
  case "${ans:-Y}" in
    [Aa]*) SEED_LEVEL=admin ;;
    [Ss]*) SEED_LEVEL=skip ;;
    *)     SEED_LEVEL=full ;;
  esac
elif [ -z "$SEED_LEVEL" ]; then
  # Non-TTY (CI, pipe) — défaut admin seulement
  SEED_LEVEL=admin
fi

case "$SEED_LEVEL" in
  full)
    echo "─── Seeding complet (admin + roles + activités + demo) ───"
    npm run seed
    ;;
  admin)
    echo "─── Seeding admin seulement ───"
    npm run seed:admin
    ;;
  skip)
    echo "─── Seed skipped (DB supposée déjà chargée) ───"
    ;;
  *)
    echo "⚠  SEED_LEVEL inconnu : '$SEED_LEVEL' — défaut admin"
    npm run seed:admin
    ;;
esac

# 4) Démarrage app
echo ""
echo "─── Starting Next.js on http://localhost:4567 ───"
echo "    (Ctrl+C pour arrêter ; relancer avec ./16-mosta-parkmanager.sh)"
echo ""
npm run dev
