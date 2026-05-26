# 17-normalize-docs

> `normalizeDoc` + `normalizeDocs` : ce que **fait** et ce que **ne fait pas** la normalisation côté `@mostajs/orm`. Comparaison **BaseRepository auto vs `executeQuery` brut** + démonstration des conversions par `deserializeField` (boolean/json/array) + ⚠️ piège des **dates** par dialect (SQLite string ISO vs Postgres/Mongo Date natif).

**Couvre** : `normalizeDoc<T>`, `normalizeDocs<T>`, `NormalizedDoc`, `_id → id`, suppression `__v`, récursion sous-objets/arrays, conversions `deserializeField` (`boolean`/`json`/`array`), piège **date dialect-dependent** (cf. `llms.txt` §NORMALISATION).

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/17-normalize-docs ~/my-normalize-app
cd ~/my-normalize-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./17-normalize-docs.sh
```

## Expected output

```
═══ Normalisation — @mostajs/orm ═══
✓ Event créé : id='abc12345…'
─── (1) BaseRepository.findById → normalizeDoc + deserialize auto ───
   typeof isOpen   = 'boolean'   → true
   typeof capacity = 'number' → 500
   typeof tags     = 'array' → ["vip","soiree"]
   typeof metadata = 'object' → {"sponsor":"Mosta","livestream":true}
   typeof startsAt = 'string' → 2026-04-01T08:00:00.000Z
   startsAt instanceof Date ? false
   ⚠️  startsAt est STRING ISO (comportement SQLite — cf. llms.txt §NORMALISATION)
      Re-hydratation : new Date(val) → 2026-04-01T08:00:00.000Z
─── (2) BaseRepository.findAll → normalizeDocs auto ───
   findAll() = 1 row(s), tous normalisés en bloc
─── (3) executeQuery RAW (SQLite) — pas de deserialize, pas de normalize ───
   typeof isOpen   = 'number'   → 1     (RAW : 1, pas true)
   typeof tags     = 'string'   → "[\"vip\",\"soiree\"]"    (RAW : string JSON, pas array)
   typeof metadata = 'string'   → "{\"sponsor\":\"Mosta\",\"livestream\":true}"
   typeof startsAt = 'string'   → "2026-04-01T08:00:00.000Z"
─── (4) normalizeDoc manuel — _id → id + suppression __v + récursion ───
   _id        → id          : '507f1f77bcf86cd799439011'
   __v supprimé             : true
   nested._id → nested.id   : 'sub-id-xyz'
   nested.__v supprimé      : true
   items[0]._id → items[0].id : 'item-1'
   items[2] (string brut)   : 'plain-string' (non touché)
─── (5) normalizeDocs sur un array ───
   3 docs normalisés : a=A, b=B, c=C
─── (6) Cas limites ───
   normalizeDoc(null)      = null
   normalizeDoc(undefined) = undefined
   normalizeDoc(obj sans _id ni id) → id = undefined, name = 'no-id'
✅ Smoke OK — normalizeDoc + normalizeDocs + conversions par dialect (SQLite).
```

## What it shows

### 3 actions de `normalizeDoc(doc)`

| Transformation | Source | Cible |
|---|---|---|
| `_id` → `id` | `doc._id` (Mongo ObjectId ou string) | `doc.id: string` |
| Suppression `__v` | `doc.__v` (mongoose version) | (retiré) |
| Récursion | sous-objets et items d'array contenant `_id !== undefined` | `_id → id` interne |

`normalizeDoc(null)` / `normalizeDoc(undefined)` → no-op (retourne l'input).

### Ce que `normalizeDoc` ne fait **pas**

- Conversion de **dates** (déléguée au dialect — `mongo.dialect.ts:60` hydrate
  Date natif via mongoose, SQL via driver natif Postgres/MySQL ; **SQLite garde string ISO**)
- Conversion `boolean` `0/1` → `true/false` (fait par `deserializeBoolean` du dialect SQL)
- Parse `json` / `array` (fait par `deserializeField` du dialect SQL)
- Validation de schéma (zod / autre)
- Soft-delete filter (fait par `applySoftDeleteFilter` du dialect)

### Quand appeler `normalizeDoc` manuellement

`BaseRepository` applique **automatiquement** après chaque read. Appel
manuel utile pour :

- Résultat de `dialect.executeQuery(rawSQL, params)` (SQL brut, hors repo)
- Documents Mongo récupérés via mongoose direct
- Migration de code legacy qui manipule des `_id`

### ⚠️ Piège date SQLite

`deserializeField('date', val)` retourne `val` tel quel. Sur SQLite :
- Stockage : TEXT ISO 8601 (`"2026-04-01T08:00:00.000Z"`)
- Retour `BaseRepository.findById` : **string ISO**, **pas un `Date`**
- `viaRepo.startsAt instanceof Date` → `false` 🚨

**Re-hydratation côté consumer** :

```ts
const event = await events.findById(id)
const startsAt = event.startsAt instanceof Date
  ? event.startsAt
  : new Date(event.startsAt as string)
```

Sur Postgres/MySQL (driver `pg`/`mysql2`), TIMESTAMP est nativement hydraté
en `Date` JS. Sur MongoDB (BSON Date via mongoose), idem. **Seul SQLite
nécessite la re-hydratation manuelle.**

### Piège HTTP (mode NET via `@mostajs/data-plug`)

Si vous passez par `@mostajs/net`, `JSON.stringify(date)` produit une
string ISO et `JSON.parse` côté client retourne la string — comportement
standard JSON, pas une régression. Documenté côté `@mostajs/net` ; pour
préserver `Date` côté client NET, re-hydrater avec `new Date(val)`.

## Files

- `app.ts` — démo conversions auto vs manuelles + cas limites
- `schemas/index.ts` — EventSchema avec tous les FieldType
- `package.json` — déps : `@mostajs/orm` ≥ 2.2.5, `better-sqlite3`
- `17-normalize-docs.sh` — script de lancement

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
