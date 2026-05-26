# 15-tx-manual-savepoints

> Transactions complètes : wrapper `$transaction(cb)` (commit/rollback auto) + API manuelle `beginTx`/`commitTx`/`rollbackTx` (tx spanning fonctions) + `SAVEPOINT` nested (`depth >= 2`) + isolation level mappé par dialect.

**Couvre** : `$transaction(cb, opts?)`, `beginTx(opts?)`, `commitTx`, `rollbackTx`, `TxHandle` (`{ id, startedAt, depth }`), isolation level ANSI mappé (cf. fix #5 2.2.0), piège `poolSize: 1` sur dialects SQL poolés.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/15-tx-manual-savepoints ~/my-tx-app
cd ~/my-tx-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3 ; pas de pool, donc `poolSize: 1` non requis)*.

## Run

```bash
./15-tx-manual-savepoints.sh
```

## Expected output

```
═══ Transactions + savepoints — @mostajs/orm ═══
✓ Seed : alice=1000, bob=500
─── 1. $transaction(cb) : transfert OK → commit auto ───
   alice=800, bob=700 (attendu : alice=800, bob=700)
─── 2. $transaction(cb) : throw au milieu → rollback complet ───
   ✓ throw capturé : Simulated failure (rollback expected)
   alice=800 (rollback → 800, pas -199)
─── 3. beginTx / commitTx (manuel, hors callback) ───
   TxHandle { id='…', depth=1, startedAt=set }
   alice=900 (commit manuel : +100 → 900)
─── 4. SAVEPOINT nested (depth 2+) ───
   outer  : depth=1
   inner  : depth=2 (SAVEPOINT)
   après rollback inner : alice=950 (devrait être 950, pas 9999)
   après commit outer : alice=950 (devrait être 950)
─── 5. $transaction({ isolation: "SERIALIZABLE" }) sur SQLite ───
   alice=1000 (SERIALIZABLE → EXCLUSIVE pour SQLite, commit ok)
✅ Smoke OK — $transaction(cb) + manual beginTx + nested SAVEPOINT + isolation mapping.
```

## What it shows

- **`$transaction(cb)`** — wrapper recommandé : commit auto au retour normal,
  rollback auto si la callback throw.
- **`beginTx() / commitTx() / rollbackTx()`** — API manuelle pour les cas où
  une transaction doit spanner plusieurs fonctions / dépendre d'un événement
  externe / etc. Le caller est responsable de fermer **chaque** `beginTx`.
- **`TxHandle`** — `{ id: string; startedAt: number; depth: 1|2|… }`. `depth === 1`
  = transaction réelle (`BEGIN`/`COMMIT`). `depth >= 2` = `SAVEPOINT` nested.
- **SAVEPOINT nested** — appeler `beginTx` à l'intérieur d'une tx active émet
  `SAVEPOINT`. `commitTx(inner)` = `RELEASE SAVEPOINT`, `rollbackTx(inner)`
  = `ROLLBACK TO SAVEPOINT` (le outer reste actif).
- **`isolation`** — mappé par dialect (fix #5 2.2.0) :
  - SQLite : `'SERIALIZABLE'` → `BEGIN EXCLUSIVE TRANSACTION`
  - MySQL : `SET SESSION TRANSACTION ISOLATION LEVEL X; START TRANSACTION`
  - PostgreSQL : `BEGIN; SET TRANSACTION ISOLATION LEVEL X` (natif)
  - Oracle / HANA / DB2 : voir llms.txt §IDialect — mapping ANSI → niveaux natifs

**Piège `poolSize: 1`** : sur les dialects SQL poolés (Postgres/MySQL/…),
les requêtes entre `beginTx` et `commitTx` peuvent toucher des clients de
pool différents → tx incohérente. Forcer `poolSize: 1` sur `ConnectionConfig`
pour la stricte cohérence. SQLite est mono-connexion, donc OK par défaut.

## Files

- `app.ts` — démo $transaction wrapper + manual + nested SAVEPOINT + isolation
- `schemas/index.ts` — AccountSchema (transfert balance)
- `package.json` — déps : `@mostajs/orm` ≥ 2.2.5, `better-sqlite3`
- `15-tx-manual-savepoints.sh` — script de lancement

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
