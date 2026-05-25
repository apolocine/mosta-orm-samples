# 07-filter-query-mongodb-like

> Tous les opérateurs MongoDB-like : `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$regex`, `$exists`, `$or`, `$and`. Plus QueryOptions (sort, skip, limit, select).

**Couvre** : `FilterOperator`, `FilterValue`, `FilterQuery`, `QueryOptions`
*(sort, skip, limit, select, exclude)*, `SortDirection`, `PaginatedResult`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/07-filter-query-mongodb-like ~/my-filter-app
cd ~/my-filter-app
rm -rf ../tmp
```

## External resources

aucune.

## Run

```bash
./07-filter-query-mongodb-like.sh
```

## Expected output

```
─── Filter operators & QueryOptions — @mostajs/orm ───
✓ seeded 10 users with varied ages, status, tags
$eq    age === 25                    → 1 user(s)
$ne    age !== 25                    → 9 user(s)
$gt    age > 30                      → 4 user(s)
$gte   age >= 30                     → 5 user(s)
$lt    age < 30                      → 5 user(s)
$lte   age <= 30                     → 6 user(s)
$in    status in [active, pending]   → 7 user(s)
$nin   status not in [banned]        → 9 user(s)
$regex email matches @example\.com$  → 10 user(s)
$exists premium exists               → 4 user(s)
$or    age<25 OR status=banned       → 4 user(s)
$and   age>=30 AND status=active     → 3 user(s)
─── QueryOptions ───
sort: { age: -1 }, limit: 3      → top 3 par age desc
skip: 7, limit: 3                → pagination 8-10
select: ['email','age']          → projection 2 fields
✅ Smoke OK — 12 opérateurs + QueryOptions démontrés.
```

## What it shows

- Chaque opérateur `FilterOperator` exercé sur un dataset de 10 users
- `$or` / `$and` pour combinaisons logiques
- `QueryOptions` complets : `sort` (asc/desc), `skip` + `limit` (pagination),
  `select` (projection)

## Files

- `app.ts` — démonstration de chaque opérateur en séquence
- `schemas/user.schema.ts` — User varié (age, status, tags, premium optionnel)

**Author** : Dr Hamid MADANI <drmdh@msn.com>
