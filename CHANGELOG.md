# Changelog — `@mostajs/orm-samples`

All notable changes to this project will be documented in this file.

## [0.3.0] — 2026-05-26

### Added — Lot 3 + showcase end-to-end + sample transversal (+8 samples)

**17 samples au total** (vs 9 en 0.2.0).

#### Lot 3 — Relations & lifecycle (6 samples)

- **10-relations-cascade** — 4 RelationType + `CascadeType` + `OnDeleteAction` + `mappedBy`/`joinColumn`/`through`/`orphanRemoval`
- **11-lazy-vs-eager-fetch** — BREAKING 2.0 lazy default + `findByIdWithRelations` + `extractRelId` (R019/R021-safe)
- **12-migration-diff** — `diffSchemas` + `DiffOperation` (14 variantes) + `generateMigrationSQL` + `strategy:'update'`
- **13-soft-delete-native** — `softDelete` + `deletedAt` auto + `includeDeleted` + sparse partial unique (R003B)
- **14-audit-by-fields** — `DEFAULT_AUDIT_BY_FIELDS` (8 champs) + wrapper audit minimal
- **15-tx-manual-savepoints** — `$transaction(cb)` + `beginTx`/`commitTx`/`rollbackTx` + `SAVEPOINT` nested + isolation par dialect

#### Lot transversal — Normalisation (1 sample)

- **17-normalize-docs** — `normalizeDoc` + `normalizeDocs` + conversions par dialect + piège date SQLite (string ISO vs Date natif)

#### ⭐ Sample showcase end-to-end (1 sample-application)

- **16-mosta-parkmanager** — Application complète Next.js 16 + Electron de gestion d'un parc de loisirs/attractions.
  **11 modules `@mostajs/*`** (orm, data-plug, auth, rbac, audit, scan, ui, settings, menu, init, net) intégrés.
  14 entités. Multi-dialecte (SQLite/Postgres/MySQL/Oracle/MongoDB). Mode SaaS web + Electron desktop + hybride NET.
  **Seul exemple public d'intégration end-to-end de l'écosystème.**

### Changed

- Peer-dep `@mostajs/orm` : `>=2.1.0` → `>=2.2.8` (les samples Lot 3 dépendent des fixes 2.2.x — duplicate FK, SQLite FK in-line, populate joinColumn, system columns, sparse partial unique, lazy refresh, Mongo index doublon)
- Description package : reflète "17 samples + 1 showcase end-to-end"

### Documentation

- README enrichi : section ⭐ "À la une" sur sample 16, catalogue complet 17 samples par lot, emplacement screenshots
- Sample 16 a son propre README détaillé (architecture, 11 modules, cascade config, 3 modes runtime, lien retour vers les 15 micro-samples)
- Tous les samples Lot 3 documentés avec sections `What it shows` + pièges spécifiques

### Liens

- Spec ORM des anomalies fixées : `mostajs/mosta-orm/docs/ANOMALIES-LOT3-2026-05-25.md` (propriétaire entreprise)
- `mostajs/mosta-orm` : 2.1.0 → 2.2.8 sur le même cycle (8 patches publiés)

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>

---

## [0.2.0] — 2026-05-25

### Added — Lot 2 : CRUD & queries (4 samples)

- **`06-base-repository-crud`** — 15 méthodes du `BaseRepository` en séquence :
  read (`findAll`, `findOne`, `findById`, `count`, `distinct`, `search`),
  write (`create`, `update`, `updateMany`, `upsert`), delete (`delete`,
  `deleteMany`), atomic (`increment`, `addToSet`, `pull`).

- **`07-filter-query-mongodb-like`** — 12 opérateurs `FilterOperator` :
  `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$regex`,
  `$exists`, `$or`, `$and`. Plus `QueryOptions` complets : `sort`, `skip`,
  `limit`, `select`. `SortDirection`.

- **`08-aggregate-pipeline`** — Pipeline d'agrégation MongoDB-style :
  `$match`, `$group`, `$sort`, `$limit`, `AggregateAccumulator` (`$sum`).
  **Requiert MongoDB** (le pipeline `$group` avec expression `'$field'`
  est natif Mongo ; SQL non supporté en V1).

- **`09-findbyid-polymorphic`** — 4 formes de `findById` (string PK,
  `{id}`, natural key single, composite natural key) + `extractRelId`
  helper + `OrmIntrospectionError` typée (avec `schemaName` /
  `availableFields`). La vitrine du polymorphisme 2.0.

### Critère sortie Lot 2

Tout `BaseRepository` est démontré (15/18 méthodes — `findByIdWithRelations`
et `findWithRelations` sont dans le Lot 3 avec les relations).

**Author** : Dr Hamid MADANI <drmdh@msn.com>

## [0.1.0] — 2026-05-25

### Added — Lot 1 : Fondamentaux (5 samples)

- **`01-quickstart-sqlite`** — Pattern de base reproduisant le snippet
  `## PATTERN` du llms.txt @mostajs/orm. Démontre : `createConnection`,
  `BaseRepository`, `EntitySchema`, `FieldType`, `FieldDef`, `create`,
  `findOne`, `ConnectionConfig`, `SchemaStrategy: 'update'`.

- **`02-multi-dialect-switch`** — Un seul code TypeScript, dialect changé
  via `.env`. Démontre : `getConfigFromEnv`, `DialectType`, `ConnectionConfig`,
  `SchemaStrategy`, `DIALECT_CONFIGS`, `getSupportedDialects`,
  `getDialectConfig`, `DialectConfig`, `getCurrentDialectType`.

- **`03-isolated-connections`** — Multi-tenant via `createIsolatedDialect`
  + named connections. Démontre : `createIsolatedDialect`, `getDialect`
  singleton (piège), `registerNamedConnection`, `getNamedConnection`,
  `listNamedConnections`, `clearNamedConnections`.

- **`04-schema-registry`** — Registre global de schémas. Démontre :
  `registerSchema`, `registerSchemas`, `getSchema`, `getSchemaByCollection`,
  `getAllSchemas`, `getEntityNames`, `hasSchema`, `validateSchemas`,
  `clearRegistry`.

- **`05-types-cles-entity-schema`** — Tous les champs `EntitySchema` au moins
  une fois. Démontre : `EntitySchema`, `FieldDef` exhaustif, `FieldType`
  (string/text/number/boolean/date/json/array), `EmbeddedSchemaDef`,
  `IndexDef`, `IndexType` (asc/desc/text), `discriminator`, `softDelete`,
  `timestamps`.

### Added — Scaffold module

- `package.json` (peer dep `@mostajs/orm ≥ 2.1.0`, bin `mostajs-orm-samples`)
- `tsconfig.json` strict
- `src/cli.ts` — CLI `list | scaffold | check | help`
- `README.md`, `llms.txt`, `LICENSE` (AGPL-3.0-or-later)
- `.gitignore` (exclut `examples/**/node_modules`, `*.db`, etc.)

### Décisions design

- Module npm séparé de `@mostajs/orm` (peer dep)
- Substitut public des tests internes (qui restent propriétaires entreprise —
  cf. règle `feedback_public_vs_private_repo`)
- Chaque sample est autonome : `npm install` dans le sample lui-même quand
  l'utilisateur le copie
- Default SQLite (zéro install externe) ; alternatives Postgres/MySQL
  commentées dans `.env.example`

**Author** : Dr Hamid MADANI <drmdh@msn.com>
