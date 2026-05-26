# start-net.sh — guide d'utilisation

Démarre un serveur `@mostajs/net` exposant les 14 entités mosta-parkmanager
en REST / SSE / WS / JSON-RPC. Utile pour le mode hybride (poste léger
qui consomme un serveur distant via `@mostajs/data-plug`).

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>

## Prérequis

```bash
npm install                              # inclut @mostajs/net + @mostajs/orm
chmod +x start-net.sh
```

## Démarrage

```bash
# Démarrage par défaut (port 4488, SQLite local)
./start-net.sh

# Port custom
./start-net.sh 5000

# Avec PostgreSQL
DB_DIALECT=postgres \
SGBD_URI="postgres://user:pass@localhost:5432/parkmanagerdb" \
./start-net.sh

# Avec Oracle
DB_DIALECT=oracle \
SGBD_URI="oracle://user:pass@localhost:1521/SERVICE" \
./start-net.sh

# Avec MongoDB
DB_DIALECT=mongodb \
SGBD_URI="mongodb://localhost:27017/parkmanagerdb" \
./start-net.sh
```

## Consommer depuis un client mosta-parkmanager (mode NET)

Dans le `.env.local` du client :

```bash
MOSTA_NET_URL=http://serveur-net:4488
MOSTA_NET_APIKEY=msk_xxxxxxxxxxxxxxxx
```

`@mostajs/data-plug` détecte `MOSTA_NET_URL` et bascule automatiquement
en mode NET — aucune connexion DB locale requise.
