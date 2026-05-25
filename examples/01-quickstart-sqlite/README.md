# 01-quickstart-sqlite

> Pattern de base ORM en SQLite — createConnection + BaseRepository + create + findOne.

**Couvre** : `createConnection`, `BaseRepository`, `EntitySchema`, `FieldType`,
`FieldDef`, `create`, `findOne`, `ConnectionConfig`, `SchemaStrategy: 'update'`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/01-quickstart-sqlite ~/my-quickstart-app
cd ~/my-quickstart-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3 inclus en dev dependency)*.

## Run

```bash
./01-quickstart-sqlite.sh
```

## Expected output

```
─── Quickstart SQLite — @mostajs/orm ───
✓ Connected to SQLite (./app.db)
✓ User created (id=…)
✓ findOne by email returned: { id: '…', email: 'alice@example.com', name: 'Alice' }
✓ count = 1
✅ Smoke OK
```

## What it shows

- Le `EntitySchema` minimal (fields + indexes vides + timestamps)
- L'`createConnection` synchrone avec `SchemaStrategy: 'update'` qui crée la
  table automatiquement
- L'instanciation du `BaseRepository<TUser>` typé
- Le cycle `create()` → `findOne()` → `count()` en 4 lignes

## Files

- `app.ts` — main code
- `schemas/user.schema.ts` — schéma User minimal
- `.env.example` — config (DB_DIALECT=sqlite par défaut)

**Author** : Dr Hamid MADANI <drmdh@msn.com>
