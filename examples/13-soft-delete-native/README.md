# 13-soft-delete-native

> `softDelete: true` injecte `deletedAt` automatiquement + filtre auto sur `find/count/findOne` + bypass `includeDeleted` (2.2.0+) + `sparse: true` sur unique index pour réinsertion (R003B).

**Couvre** : `softDelete: true`, injection auto `deletedAt`, filtre auto sur read methods, `QueryOptions.includeDeleted`, `sparse` partial unique index, **R003B** prévention. Comparaison hard-delete.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/13-soft-delete-native ~/my-softdelete-app
cd ~/my-softdelete-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./13-soft-delete-native.sh
```

## Expected output

```
═══ Soft-delete natif — @mostajs/orm ═══
✓ seeded : 2 users + 1 comment
─── delete(Alice) ───
   count() = 1 (auto-filtré : seul Bob actif)
   count({ includeDeleted: true }) = 2 (Alice + Bob)
─── findOne / findById sur Alice (soft-deleted) ───
   findOne({email}) = null
   findById(aliceId) = null
   findOne(email, includeDeleted) = Alice retrouvée, deletedAt=set
─── Réinsertion email — sparse unique (R003B) ───
   ✓ Nouveau User 'Alice (re-registered)' créé avec le même email (sparse:true sur unique)
   2 users avec cet email (1 active + 1 deleted) via includeDeleted
─── Comparaison : hard-delete sur CommentSchema (sans softDelete) ───
   hard-delete : SELECT COUNT(*) FROM comments = 0 (vs soft = row toujours là)
✅ Smoke OK — softDelete + sparse + includeDeleted + comparaison hard-delete.
```

## What it shows

- **`softDelete: true`** sur l'`EntitySchema` :
  - Injecte automatiquement `deletedAt: Date | null` dans la table
  - `delete(id)` → `UPDATE … SET deletedAt = now` (pas DELETE physique)
  - Auto-filtre `WHERE deletedAt IS NULL` sur `find` / `findOne` / `findById` / `count` / `distinct` / `aggregate` / `search`
- **`QueryOptions.includeDeleted: true`** (2.2.0+) bypasse le filtre :
  retourne tous les docs y compris soft-deletés
- **`sparse: true`** sur `unique` index : la contrainte ne s'applique pas aux rows avec
  `deletedAt != null` → **réinsertion possible** après soft-delete (R003B-safe)
- **Hard-delete** sur schémas sans `softDelete` (CommentSchema) : `DELETE FROM ...`
  physique, la row disparaît définitivement

**R003B prévention** : sans `sparse: true`, un index unique reste actif sur la
soft-deleted row → réinsertion impossible (`UNIQUE constraint violation`). Le
validator `@mostajs/orm/validator` R003B détecte ce cas et auto-fixe en ajoutant
`sparse: true`.

## Files

- `app.ts` — démo soft-delete + sparse + includeDeleted + comparaison hard-delete
- `schemas/index.ts` — UserSchema (softDelete + sparse) + CommentSchema (hard-delete)
- `package.json` — déps : `@mostajs/orm` ≥ 2.2.4, `better-sqlite3`
- `13-soft-delete-native.sh` — script de lancement

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
