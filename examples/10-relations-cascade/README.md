# 10-relations-cascade

> Les 4 RelationType (1-1, 1-M, M-1, M-M) + `CascadeType` + `OnDeleteAction` + `mappedBy`/`joinColumn`/`through`/`orphanRemoval`. Démontre aussi le piège `cascade: ['remove']` sur M-M (à éviter).

**Couvre** : `RelationDef`, `RelationType` (`one-to-one`/`many-to-one`/`one-to-many`/`many-to-many`),
`CascadeType` (`'persist'|'merge'|'remove'|'all'`), `OnDeleteAction` (`'cascade'|'set-null'|'restrict'|'no-action'`),
`mappedBy`, `joinColumn`, `inverseJoinColumn`, `through`, `orphanRemoval`, `required`, `nullable`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/10-relations-cascade ~/my-relations-app
cd ~/my-relations-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./10-relations-cascade.sh
```

## Expected output

```
─── Relations + cascade — @mostajs/orm ───
✓ seeded : Alice + Profile + 2 Posts + 2 Tags + 3 PostTag rows
─── 1-1 : User ←→ Profile
   → Profile.bio='Hello, world!' lié à User 'Alice'
─── 1-M : User → Posts
   → 2 post(s) de 'Alice' (mappedBy='author')
─── M-1 : Post → Author (joinColumn='authorId')
   → Post 'First post' authorId='Alice' (via joinColumn)
─── M-M : Post ←→ Tags (through='PostTag')
   → Post 'First post' a 2 tag(s) via table jointure
─── Cascade : delete User Alice
   → Profile supprimé : true (onDelete:'cascade')
   → Posts supprimés  : true (onDelete:'cascade')
─── Anti-cascade : delete Tag ne supprime PAS de Post
   → Post 'Solo' survit à la suppression du Tag
   → La ligne PostTag est supprimée (FK onDelete:'cascade' sur join row)
✅ Smoke OK — 4 relations + cascade + anti-cascade.
```

## What it shows

- **1-1** : `User.profile` (`mappedBy: 'user'`) ←→ `Profile.user` (`joinColumn: 'userId'`, `onDelete: 'cascade'`)
- **1-M / M-1** : `User.posts` (`mappedBy: 'author'`) ←→ `Post.author` (`joinColumn: 'authorId'`, `onDelete: 'cascade'`)
- **M-M** : `Post.tags` ←→ `Tag` **via `through: 'PostTag'`** (table de jointure explicite avec ses propres FK)
- **Cascade onDelete** : supprimer le `User` parent supprime Profile + Posts liés (FK SQL natives)
- **Anti-cascade M-M** : supprimer un `Tag` n'écrase pas le `Post` lié — seule la ligne de jointure
  est purgée. C'est pourquoi `cascade: ['remove'|'all']` sur M-M est qualifié de "catastrophe"
  dans le `llms.txt` : ça forcerait l'inverse, en propageant la suppression côté entité cible.

## Files

- `app.ts` — démo des 4 types + cascade observable
- `schemas/index.ts` — User / Profile / Post / Tag / PostTag (table de jointure M-M)
- `package.json` — déps : `@mostajs/orm` ≥ 2.1.0, `better-sqlite3`
- `10-relations-cascade.sh` — script de lancement (npm install si absent + tsx)

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
