# 08-aggregate-pipeline

> Pipeline d'agrégation MongoDB-style — `$match` + `$group` + `$sort` + `$limit` avec accumulators `$sum`/`$avg`/`$count`.

**Couvre** : `aggregate`, `AggregateStage`, `AggregateGroupStage`,
`AggregateMatchStage`, `AggregateSortStage`, `AggregateLimitStage`,
`AggregateAccumulator`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/08-aggregate-pipeline ~/my-aggregate-app
cd ~/my-aggregate-app
rm -rf ../tmp
```

## External resources

**MongoDB requis** *(pas SQLite)* — le pipeline `$match/$group/$sort/$limit`
est natif Mongo. SQLite ne mappe pas correctement l'expression `'$customerId'`
vers une référence de colonne.

```bash
# Local (sans auth, instance déjà tournante) :
# Cf. .env.example pour les variantes.

# OR : docker
docker run -d -p 27017:27017 --name mongo mongo:7

# OR : MongoDB Atlas cloud cluster (cf. .env.example)
```

Le `.env.example` fourni utilise par défaut une instance Mongo accessible
en `[::1]:27017` avec credentials `devuser/devpass26?authSource=admin`.
Adapter selon votre environnement.

## Run

```bash
./08-aggregate-pipeline.sh
```

## Expected output

```
─── Aggregate pipeline — @mostajs/orm ───
✓ seeded 15 orders across 3 customers, statuses [completed,pending,cancelled]
─── Pipeline : top 3 customers par CA (completed only) ───
  - cust-c   total=  4500  count= 3
  - cust-a   total=  3000  count= 2
  - cust-b   total=  1500  count= 1
✓ 3 résultats triés desc
─── Pipeline : count par status ───
  - completed   6
  - pending     5
  - cancelled   4
✓ chaque status agrégé
✅ Smoke OK — pipeline aggregate démontré.
```

## What it shows

- `$match` : filtrage initial avant agrégation
- `$group` avec `_id` = clé de groupement et accumulators `$sum`, `$count`
- `$sort` : tri des résultats agrégés
- `$limit` : top-N

## Files

- `app.ts` — 2 pipelines distincts (top-N + count par status)
- `schemas/order.schema.ts` — Order avec customerId, status, amount

**Author** : Dr Hamid MADANI <drmdh@msn.com>
