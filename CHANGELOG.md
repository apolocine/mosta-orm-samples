# Changelog — `@mostajs/orm-samples`

All notable changes to this project will be documented in this file.

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
