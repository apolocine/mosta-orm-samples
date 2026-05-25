# `@mostajs/orm-samples`

> Runnable samples covering 100% of `@mostajs/orm`'s public API — copy-paste install per feature.

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
**Statut** : V1 — Lot 1 (samples 01-05) livré

---

## Pourquoi ce module ?

Chaque sample démontre **une fonctionnalité** de `@mostajs/orm` en moins de
100 lignes de code, runnable en une commande, **sans framework parasite**
(pas d'Express, pas de Next.js — juste l'ORM).

Couverture cible : **chaque ligne du `llms.txt` de `@mostajs/orm` est démontrée
par au moins un sample** (garde-fou via test pérenne).

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

Chaque sample s'installe via 4 commandes :

```bash
# 1. Install package (cwd ne compte pas — temporaire)
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples

# 2. Copy the scaffold to your project location
cp -r node_modules/@mostajs/orm-samples/examples/<feature> ~/my-<feature>-app
cd ~/my-<feature>-app
rm -rf ../tmp

# 3. Install external resources éventuelles (driver SGBD, ffmpeg, etc.)
sudo apt install <package>           # ou : brew install <package>

# 4. Launch (auto-handles npm install)
./<feature>.sh
```

## Catalogue (Lots 1 & 2 — Fondamentaux + CRUD & queries)

### Lot 1 — Fondamentaux

| # | Sample | Démontre |
|---|---|---|
| 01 | [`01-quickstart-sqlite`](examples/01-quickstart-sqlite/) | Pattern de base : `createConnection` + `BaseRepository` + `create` + `findOne` |
| 02 | [`02-multi-dialect-switch`](examples/02-multi-dialect-switch/) | `getConfigFromEnv` + `DialectType` + `DIALECT_CONFIGS` — un seul code, plusieurs SGBD |
| 03 | [`03-isolated-connections`](examples/03-isolated-connections/) | `createIsolatedDialect` + connexions nommées pour multi-tenant |
| 04 | [`04-schema-registry`](examples/04-schema-registry/) | Registre global `registerSchema`/`getSchema`/`validateSchemas`/`clearRegistry` |
| 05 | [`05-types-cles-entity-schema`](examples/05-types-cles-entity-schema/) | Tous les `FieldType`/`FieldDef`/`IndexDef` + `softDelete` + `discriminator` |

### Lot 2 — CRUD & queries

| # | Sample | Démontre |
|---|---|---|
| 06 | [`06-base-repository-crud`](examples/06-base-repository-crud/) | 15 méthodes `BaseRepository` : create/read/update/delete + atomic (increment/addToSet/pull) + upsert + search/distinct |
| 07 | [`07-filter-query-mongodb-like`](examples/07-filter-query-mongodb-like/) | 12 opérateurs `FilterOperator` (`$eq`/`$ne`/`$gt`/`$gte`/`$lt`/`$lte`/`$in`/`$nin`/`$regex`/`$exists`/`$or`/`$and`) + `QueryOptions` complets |
| 08 | [`08-aggregate-pipeline`](examples/08-aggregate-pipeline/) | Pipeline d'agrégation `$match`+`$group`+`$sort`+`$limit` (MongoDB-only) |
| 09 | [`09-findbyid-polymorphic`](examples/09-findbyid-polymorphic/) | 4 formes de `findById` (string / `{id}` / natural key / composite) + `extractRelId` + `OrmIntrospectionError` |

Lots suivants (cf. ROADMAP propriétaire entreprise) : Relations & lifecycle
(10-15), Plugins & sous-modules (16-18), Validator & erreurs (19-25).

## CLI `mostajs-orm-samples`

```bash
mostajs-orm-samples list                       # liste les samples
mostajs-orm-samples list --json                # machine-readable
mostajs-orm-samples scaffold <feature> [dest]  # copie le scaffold
mostajs-orm-samples check <feature>            # ressources requises
mostajs-orm-samples help [feature]             # aide globale ou par sample
```

## Licence

AGPL-3.0-or-later — voir [LICENSE](LICENSE).
