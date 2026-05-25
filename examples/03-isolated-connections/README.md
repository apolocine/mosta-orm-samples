# 03-isolated-connections

> Multi-tenant via `createIsolatedDialect` + connexions nommées — démontre la différence entre singleton `getDialect()` et instances isolées.

**Couvre** : `createIsolatedDialect`, `getDialect` (piège singleton),
`registerNamedConnection`, `getNamedConnection`, `removeNamedConnection`,
`listNamedConnections`, `clearNamedConnections`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/03-isolated-connections ~/my-isolated-app
cd ~/my-isolated-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./03-isolated-connections.sh
```

## Expected output

```
─── Isolated connections — @mostajs/orm ───
✓ tenant-a connecté à ./tenant-a.db
✓ tenant-b connecté à ./tenant-b.db
✓ named connections enregistrées : tenant-a, tenant-b
✓ count tenant-a = 1
✓ count tenant-b = 2
✓ DBs physiquement distinctes (count diffère)
✅ Smoke OK
```

## What it shows

- **Piège singleton** : `getDialect()` retourne **toujours la même
  instance**. Pour deux tenants, utiliser `createIsolatedDialect()` qui
  bypass le singleton.
- **Named connections** : registre clé→dialect pour récupérer une
  connexion par nom métier sans la passer en paramètre partout.
- **Lifecycle complet** : register → use → unregister → clear.

## Files

- `app.ts` — main code multi-tenant
- `schemas/user.schema.ts` — schéma partagé entre les 2 tenants
- `.env.example` — config

**Author** : Dr Hamid MADANI <drmdh@msn.com>
