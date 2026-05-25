# 02-multi-dialect-switch

> Un seul code TypeScript, dialect changé via `.env` — démontre la portabilité multi-dialecte de @mostajs/orm.

**Couvre** : `getConfigFromEnv`, `DialectType`, `ConnectionConfig`,
`SchemaStrategy`, `DIALECT_CONFIGS`, `getSupportedDialects`,
`getDialectConfig`, `DialectConfig`, `getCurrentDialectType`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/02-multi-dialect-switch ~/my-multi-dialect-app
cd ~/my-multi-dialect-app
rm -rf ../tmp
```

## External resources

- **Default SQLite** : aucune (better-sqlite3 inclus)
- **Postgres** *(optionnel)* : `brew install postgresql` ou Docker
  `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:16`
- **MySQL** *(optionnel)* : `brew install mysql` ou Docker
  `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=test mysql:8`

## Run

```bash
# Default SQLite :
./02-multi-dialect-switch.sh

# Postgres :
DB_DIALECT=postgres SGBD_URI=postgresql://postgres:test@localhost:5432/test ./02-multi-dialect-switch.sh

# MySQL :
DB_DIALECT=mysql SGBD_URI=mysql://root:test@localhost:3306/test ./02-multi-dialect-switch.sh
```

## Expected output

```
─── Multi-dialect switch — @mostajs/orm ───
Dialects supportés :
  - sqlite     SQLite (better-sqlite3)
  - postgres   PostgreSQL (pg)
  - mysql      MySQL (mysql2)
  …
✓ Config courante : { dialect: 'sqlite', uri: './app.db', … }
✓ Connecté à : sqlite
✓ User créé sur sqlite (id=…)
✅ Smoke OK — le même code marche sur n'importe quel dialect.
```

## What it shows

- `getSupportedDialects()` retourne les 13 dialects connus
- `getDialectConfig(name)` retourne la métadata d'un dialect (driver, etc.)
- `getConfigFromEnv()` lit `DB_DIALECT` + `SGBD_URI` (+ cascade MOSTA_ENV)
- Le **même code applicatif** tourne sur SQLite / Postgres / MySQL en ne
  changeant que le `.env`

## Files

- `app.ts` — main code (entièrement dialect-agnostic)
- `schemas/user.schema.ts` — schéma User minimal
- `.env.example` — 3 dialects commentés

**Author** : Dr Hamid MADANI <drmdh@msn.com>
