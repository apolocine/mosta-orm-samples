# 12-migration-diff

> Cycle complet de migration sans driver runtime : `diffSchemas` + `DiffOperation` (14 variantes) + `generateMigrationSQL` + `SchemaStrategy: 'update'` appliquant la migration sur une DB SQLite live.

**Couvre** : `diffSchemas`, `DiffOperation` (variantes `addField`, `addSoftDelete`, `addEntity`), `generateMigrationSQL`, `SchemaStrategy` (`'create'`, `'update'`, `'validate'`, `'create-drop'`, `'none'`).

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/12-migration-diff ~/my-migration-app
cd ~/my-migration-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./12-migration-diff.sh
```

## Expected output

```
═══ Migration diff — @mostajs/orm ═══
─── Diff UserSchema v1 → v2 ───
   2 opération(s) détectée(s) :
   • addField    : User.phone (string)
   • addSoftDelete : User (inject deletedAt + auto-filter)
─── SQL migration (dialect-agnostic) ───
   ALTER TABLE users ADD COLUMN phone VARCHAR(255)
   ALTER TABLE users ADD COLUMN deletedAt DATETIME
─── Diff [UserV2] → [UserV2, ProjectV3] ───
   1 opération(s) détectée(s) :
   • addEntity   : Project (collection: projects)
─── SchemaStrategy: "validate" applique v2 sur DB en v1 ───
   ✓ DB créée en v1, 1 user inséré
   ✓ strategy='update' migre : Alice retrouvée, phone=null
   ✓ Alice.phone='+33-1-23-45' (nouveau champ utilisable)
✅ Smoke OK — diffSchemas + DiffOperation + generateMigrationSQL + strategy update.
```

## What it shows

- **`diffSchemas(old, new)`** — calcule la liste typée des `DiffOperation` à appliquer.
- **`DiffOperation`** — union discriminée 14 variantes (cf. `llms.txt`) :
  `addField`, `removeField`, `alterField`, `addIndex`, `removeIndex`, `addEntity`,
  `removeEntity`, `renameCollection`, `addTimestamps`, `removeTimestamps`,
  `addSoftDelete`, `removeSoftDelete`, `addDiscriminator`, `removeDiscriminator`.
- **`generateMigrationSQL(ops)`** — émet du SQL DDL dialect-agnostic (standard SQL).
- **`SchemaStrategy: 'update'`** — applique automatiquement les diffs au boot. Équivalent
  Hibernate `hbm2ddl.auto=update`. **À éviter en prod** : utiliser `'validate'`
  pour bloquer si la DB diverge du code (et appliquer un script SQL contrôlé).

**Trade-off `SchemaStrategy`** :
- `'create'` — drop puis recrée à chaque boot *(dev/test only)*
- `'create-drop'` — drop à la **sortie** (cleanup test)
- `'update'` — applique les diffs *(dev seulement — risque sur prod)*
- `'validate'` — vérifie cohérence, throw si divergence *(recommandé prod)*
- `'none'` — ne touche pas le schéma *(prod avec migrations gérées par outil dédié)*

## Files

- `app.ts` — démo diff + SQL + migration live
- `schemas/index.ts` — UserSchemaV1, UserSchemaV2 (ajout field + softDelete), ProjectSchemaV3
- `package.json` — déps : `@mostajs/orm` ≥ 2.2.3, `better-sqlite3`
- `12-migration-diff.sh` — script de lancement

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
