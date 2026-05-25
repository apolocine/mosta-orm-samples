# 06-base-repository-crud

> 15 méthodes du BaseRepository en un seul flux : create, read, update, delete, count, distinct, search, upsert, increment, addToSet, pull.

**Couvre** : `findAll`, `findOne`, `findById`, `create`, `update`,
`updateMany`, `delete`, `deleteMany`, `count`, `distinct`, `search`,
`upsert`, `increment`, `addToSet`, `pull`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/06-base-repository-crud ~/my-crud-app
cd ~/my-crud-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./06-base-repository-crud.sh
```

## Expected output

```
─── BaseRepository CRUD — @mostajs/orm ───
✓ create×3 — Alice, Bob, Charlie
✓ findAll = 3, findOne(email='bob@…') = Bob, findById(aliceId) = Alice
✓ count = 3
✓ update(aliceId, {role:'admin'}) — Alice est admin
✓ updateMany(role='user', {active:true}) — 2 lignes touchées
✓ distinct('role') = [ 'admin', 'user' ]
✓ search('Char') = 1 match (Charlie)
✓ upsert(email='dave@…') → insert (id généré)
✓ increment(aliceId, 'loginCount', 1) → 1
✓ increment(aliceId, 'loginCount', 5) → 6
✓ addToSet(aliceId, 'tags', 'editor') → ['admin','editor']
✓ pull(aliceId, 'tags', 'admin') → ['editor']
✓ delete(charlieId) — 3
✓ deleteMany({role:'user'}) — 2
✅ Smoke OK — 15 méthodes BaseRepository démontrées.
```

## What it shows

- **Read** : `findAll`, `findOne`, `findById`, `count`, `distinct`, `search`
- **Write** : `create`, `update`, `updateMany`, `upsert`
- **Delete** : `delete`, `deleteMany`
- **Atomic** : `increment`, `addToSet`, `pull` (sans race condition côté SGBD)

## Files

- `app.ts` — séquence CRUD complète
- `schemas/user.schema.ts` — User avec role, tags, loginCount

**Author** : Dr Hamid MADANI <drmdh@msn.com>
