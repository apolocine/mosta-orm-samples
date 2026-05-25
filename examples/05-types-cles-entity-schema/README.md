# 05-types-cles-entity-schema

> Tous les types-clés EntitySchema démontrés : chaque FieldType, chaque FieldDef option, IndexDef, discriminator, softDelete.

**Couvre** : `EntitySchema` exhaustif, `FieldDef` *(required, unique, sparse,
default, enum, lowercase, trim, arrayOf)*, `FieldType`
*(string, text, number, boolean, date, json, array)*, `EmbeddedSchemaDef`,
`IndexDef`, `IndexType` *(asc, desc, text)*, `discriminator`,
`discriminatorValue`, `softDelete`, `timestamps`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/05-types-cles-entity-schema ~/my-types-app
cd ~/my-types-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./05-types-cles-entity-schema.sh
```

## Expected output

```
─── Types clés EntitySchema — @mostajs/orm ───
✓ Schéma Article enregistré (softDelete=true, discriminator='_type')
✓ FieldType démontrés : string, text, number, boolean, date, json, array
✓ FieldDef options démontrées : required, unique, default, enum, lowercase, trim, arrayOf
✓ IndexDef : 4 indexes dont 1 unique+sparse, 1 desc, 1 text, 1 composite
✓ Article créé avec id=… title='Hello' status='draft' (enum default)
✓ slug lowercase appliqué : 'hello-world' (input était 'Hello-World')
✓ tags arrayOf string OK : [ 'one', 'two', 'three' ]
✓ metadata JSON OK : { meta: 'sample' }
✓ Soft-delete : count={ active: 0, total: 1 } après delete
✅ Smoke OK
```

## What it shows

- Un seul schéma `Article` qui exerce **chaque field type, chaque option
  FieldDef, chaque type d'index**
- `discriminator` (single-table inheritance Drupal-style) + `discriminatorValue`
- `softDelete: true` natif + index `sparse: true` cohérent
- Validation runtime des transformations : `lowercase`, `trim`, `enum default`

## Files

- `app.ts` — main code avec assertions sur chaque option
- `schemas/article.schema.ts` — le schéma exhaustif
- `.env.example` — config SQLite

**Author** : Dr Hamid MADANI <drmdh@msn.com>
