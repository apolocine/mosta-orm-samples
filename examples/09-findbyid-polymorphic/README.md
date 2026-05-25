# 09-findbyid-polymorphic

> Les 4 formes de `findById()` (string / `{id}` / natural key single / composite) + `extractRelId` + `OrmIntrospectionError`. La vitrine de la 2.0.

**Couvre** : `findById` (4 formes), `resolveLookup`, `findMatchingUniqueIndex`,
`UniqueIndexMatch`, `ResolvedLookup`, `OrmIntrospectionError`,
`extractRelId`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/09-findbyid-polymorphic ~/my-polymorphic-app
cd ~/my-polymorphic-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./09-findbyid-polymorphic.sh
```

## Expected output

```
─── findById polymorphique + extractRelId — @mostajs/orm ───
✓ seeded : Project 'orphin' + Membership (admin sur Project 'orphin')
─── Forme 1 : findById('id-string')
   → Project name='orphin'
─── Forme 2 : findById({ id: '…' })
   → Project name='orphin'
─── Forme 3 : findById({ slug }) — natural key single
   → Project name='orphin' via unique index { slug }
─── Forme 4 : findById({ projectId, role }) — composite natural key
   → Membership found via unique index { projectId+role }
─── Erreur typée : findById({ unknown: 'foo' })
   → OrmIntrospectionError schema='Project' availableFields=[unknown]
─── Helper extractRelId
   extractRelId('abc')                 = 'abc'
   extractRelId({ id: 'abc' })         = 'abc'
   extractRelId(null)                  = ''
   extractRelId({ slug: 'foo' })       = ''  (pas d'id direct)
✅ Smoke OK — 4 formes findById + extractRelId + error typing.
```

## What it shows

- **Forme 1** : compatible legacy (string PK comme avant 2.0)
- **Forme 2** : pratique quand le caller a un objet populé en main
- **Forme 3** : natural key — l'introspection résout via `unique` index
- **Forme 4** : composite — `{tenantId, slug}` etc. via index unique composite
- **Erreur actionnable** : `OrmIntrospectionError` liste les fields disponibles + unique indexes candidats
- **`extractRelId`** : helper pour comparaisons sûres en lazy ET eager

## Files

- `app.ts` — 4 formes + extractRelId + erreur typée
- `schemas/` — Project (avec unique slug) + Membership (composite unique)

**Author** : Dr Hamid MADANI <drmdh@msn.com>
