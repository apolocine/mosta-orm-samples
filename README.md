# `@mostajs/orm-samples`

> Runnable samples couvrant 100% de l'API publique de `@mostajs/orm` — copy-paste install par feature. **17 samples** dont **1 application complète end-to-end** (sample 16, `mosta-parkmanager`).

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
**Licence** : AGPL-3.0-or-later

---

## ⭐ À la une — Sample 16 : `mosta-parkmanager`

> **Application complète Next.js 16 + Electron** de gestion d'un parc de loisirs/attractions. Assemble **11 modules `@mostajs/*`** (orm, data-plug, auth, rbac, audit, scan, ui, settings, menu, init, net) dans un vrai produit, du bootstrap à la production.

🚀 **Le seul exemple public d'intégration end-to-end** de l'écosystème `@mostajs/*`.
Démontre comment **assembler** les patterns isolés des samples 01-15 + 17 dans une
vraie application :

- 14 entités métier modélisées via `EntitySchema`
- 14 routes API Next.js REST
- Bootstrap minimal `data-plug + config (cascade env) + orm` (zéro wizard de setup)
- Multi-dialecte (SQLite/PostgreSQL/MySQL/Oracle/MongoDB) — un seul code applicatif
- Mode SaaS web + Electron desktop + hybride NET
- Auth (NextAuth v5) + RBAC matriciel + audit journalisé + scan QR/RFID + biométrie faciale

### Lancement

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/16-mosta-parkmanager ~/my-parkmanager
cd ~/my-parkmanager
rm -rf ../tmp
./16-mosta-parkmanager.sh                      # → http://localhost:4567
```

> ℹ️ `npm install` peut nécessiter `--legacy-peer-deps` selon l'état de
> l'écosystème (peer-deps `@mostajs/rbac` ↔ `@mostajs/audit`). Le script
> `16-mosta-parkmanager.sh` gère ce flag automatiquement.

### Captures d'écran

> _10 captures réelles intégrées au tarball npm sous
> `examples/16-mosta-parkmanager/screenshots/` — visibles directement
> dans le [README détaillé du sample 16](examples/16-mosta-parkmanager/README.md#captures-décran)._

| # | Écran | # | Écran |
|---|---|---|---|
| 1 | Login | 6 | Vestiaires — 80 casiers |
| 2 | Tableau de bord (KPI) | 7 | Attribution TAG Serrure RFID |
| 3 | Liste clients (visiteurs + abonnés) | 8 | Casier occupé — détail |
| 4 | Fiche client (carte abonné + QR + grille accès) | 9 | Tags RFID — gestion du parc |
| 5 | Édition client + photo native | 10 | Application Mobile Agent (QR install PWA) |

Voir le [README détaillé du sample 16](examples/16-mosta-parkmanager/README.md)
pour la documentation technique complète (11 modules, architecture, cascade config,
modes runtime, etc.).

---

## Pourquoi ce module ?

Chaque sample 01-15 + 17 démontre **une fonctionnalité isolée** de
`@mostajs/orm` en moins de 200 lignes de code, runnable en une commande,
**sans framework parasite** (pas d'Express, pas de Next.js — juste l'ORM).

Le sample 16 (`mosta-parkmanager`) montre comment **assembler tous ces
patterns** dans une vraie application Next.js + Electron production-ready.

Couverture cible : **chaque ligne du `llms.txt` de `@mostajs/orm` est démontrée
par au moins un sample** (garde-fou via test pérenne `llms-txt-coverage`).

## Install rapide

```bash
# 1. Lister tous les samples
npx @mostajs/orm-samples list

# 2. Scaffolder un sample chez vous
npx @mostajs/orm-samples scaffold <feature> ~/my-app

# 3. Lancer
cd ~/my-app && ./<feature>.sh
```

## Pattern d'install copier-coller (par feature)

```bash
# 1. Install package (cwd temporaire)
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples

# 2. Copy the scaffold
cp -r node_modules/@mostajs/orm-samples/examples/<feature> ~/my-<feature>-app
cd ~/my-<feature>-app
rm -rf ../tmp

# 3. Install drivers SGBD optionnels (selon dialect)
# (auto-installés par npm install dans la majorité des cas)

# 4. Launch (auto-handles npm install si node_modules absent)
./<feature>.sh
```

---

## Catalogue complet — 17 samples

### Lot 1 — Fondamentaux (5 samples)

| # | Sample | Démontre |
|---|---|---|
| 01 | [`01-quickstart-sqlite`](examples/01-quickstart-sqlite/) | Pattern de base : `createConnection` + `BaseRepository` + `create` + `findOne` |
| 02 | [`02-multi-dialect-switch`](examples/02-multi-dialect-switch/) | `getConfigFromEnv` + `DialectType` + `DIALECT_CONFIGS` — un seul code, plusieurs SGBD |
| 03 | [`03-isolated-connections`](examples/03-isolated-connections/) | `createIsolatedDialect` + connexions nommées pour multi-tenant |
| 04 | [`04-schema-registry`](examples/04-schema-registry/) | Registre global `registerSchema`/`getSchema`/`validateSchemas`/`clearRegistry` |
| 05 | [`05-types-cles-entity-schema`](examples/05-types-cles-entity-schema/) | Tous les `FieldType`/`FieldDef`/`IndexDef` + `softDelete` + `discriminator` |

### Lot 2 — CRUD & queries (4 samples)

| # | Sample | Démontre |
|---|---|---|
| 06 | [`06-base-repository-crud`](examples/06-base-repository-crud/) | 15 méthodes `BaseRepository` : create/read/update/delete + atomic + upsert + search/distinct |
| 07 | [`07-filter-query-mongodb-like`](examples/07-filter-query-mongodb-like/) | 12 opérateurs `FilterOperator` + `QueryOptions` complets |
| 08 | [`08-aggregate-pipeline`](examples/08-aggregate-pipeline/) | Pipeline d'agrégation `$match`+`$group`+`$sort`+`$limit` (MongoDB-only) |
| 09 | [`09-findbyid-polymorphic`](examples/09-findbyid-polymorphic/) | 4 formes de `findById` + `extractRelId` + `OrmIntrospectionError` |

### Lot 3 — Relations & lifecycle (6 samples)

| # | Sample | Démontre |
|---|---|---|
| 10 | [`10-relations-cascade`](examples/10-relations-cascade/) | 4 RelationType + `CascadeType` + `OnDeleteAction` + `mappedBy`/`joinColumn`/`through`/`orphanRemoval` |
| 11 | [`11-lazy-vs-eager-fetch`](examples/11-lazy-vs-eager-fetch/) | BREAKING 2.0 lazy default + `findByIdWithRelations` + `extractRelId` (R019/R021-safe) |
| 12 | [`12-migration-diff`](examples/12-migration-diff/) | `diffSchemas` + `DiffOperation` (14 variantes) + `generateMigrationSQL` + `strategy: 'update'` |
| 13 | [`13-soft-delete-native`](examples/13-soft-delete-native/) | `softDelete` + auto `deletedAt` + `includeDeleted` + sparse partial unique (R003B) |
| 14 | [`14-audit-by-fields`](examples/14-audit-by-fields/) | `DEFAULT_AUDIT_BY_FIELDS` (8 champs) + wrapper audit minimal |
| 15 | [`15-tx-manual-savepoints`](examples/15-tx-manual-savepoints/) | `$transaction(cb)` + `beginTx/commitTx/rollbackTx` + `SAVEPOINT` nested + isolation par dialect |

### Lot transversal — Normalisation & conversions (1 sample)

| # | Sample | Démontre |
|---|---|---|
| 17 | [`17-normalize-docs`](examples/17-normalize-docs/) | `normalizeDoc` + `normalizeDocs` + conversions par dialect + ⚠️ piège date SQLite (string ISO vs Date natif) |

### ⭐ Showcase end-to-end (1 sample-application)

| # | Sample | Démontre |
|---|---|---|
| **16** | **[`16-mosta-parkmanager`](examples/16-mosta-parkmanager/)** | **Application complète Next.js 16 + Electron de gestion d'un parc de loisirs.** 11 modules `@mostajs/*`, 14 entités, 6 SGBD supportés, 3 modes runtime (web/desktop/hybride). |

---

## CLI `mostajs-orm-samples`

```bash
mostajs-orm-samples list                       # liste les 17 samples
mostajs-orm-samples list --json                # machine-readable
mostajs-orm-samples scaffold <feature> [dest]  # copie le scaffold
mostajs-orm-samples check <feature>            # ressources requises
mostajs-orm-samples help [feature]             # aide globale ou par sample
```

## Versions de l'écosystème

| Module | Version requise |
|---|---|
| `@mostajs/orm` | `^2.3.0` |
| `@mostajs/data-plug` (sample 16) | `^1.2.5` |
| `@mostajs/auth` (sample 16) | `^2.0.2` |
| `@mostajs/rbac` (sample 16) | `^1.4.0` |
| Node.js | `>=18.0.0` |

> Les samples du Lot 3 (10-15) et le showcase 16 dépendent des fixes cumulés
> 2.2.x (anomalies Lot 3 documentées dans `mosta-orm/docs/ANOMALIES-LOT3-2026-05-25.md`,
> propriétaire entreprise) et de la feature `DB_TABLE_PREFIX` introduite en 2.3.0
> (cohabitation multi-apps sur DB Oracle/MSSQL/HANA partagé).

## Licence

AGPL-3.0-or-later — voir [LICENSE](LICENSE).

## Crédits

**Dr Hamid MADANI** <drmdh@msn.com> · architecte et auteur principal.
Construction sur l'écosystème [mostajs.dev](https://mostajs.dev).
