# 04-schema-registry

> Registre global de schémas : register / lookup / validate / clear, indépendant du dialect.

**Couvre** : `registerSchema`, `registerSchemas`, `getSchema`,
`getSchemaByCollection`, `getAllSchemas`, `getEntityNames`, `hasSchema`,
`validateSchemas`, `clearRegistry`.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/04-schema-registry ~/my-registry-app
cd ~/my-registry-app
rm -rf ../tmp
```

## External resources

aucune.

## Run

```bash
./04-schema-registry.sh
```

## Expected output

```
─── Schema registry — @mostajs/orm ───
✓ 3 schémas enregistrés en batch : User, Project, Registration
✓ getEntityNames() = [ 'User', 'Project', 'Registration' ]
✓ hasSchema('User') = true
✓ getSchema('User').collection = 'users'
✓ getSchemaByCollection('projects').name = 'Project'
✓ validateSchemas() = { valid: true, errors: [] }
✓ clearRegistry() → 0 schémas restants
✓ ré-registerSchema('Tag') → hasSchema('Tag') = true
✅ Smoke OK
```

## What it shows

- `registerSchemas([…])` (batch) vs `registerSchema(s)` (single)
- 3 lookups : par nom, par collection, all
- `validateSchemas()` vérifie que les cibles de relations existent dans le registre
- Cycle complet : register → use → clear → re-register

## Files

- `app.ts` — main code
- `schemas/` — 3 schémas (User, Project, Registration) avec relations
- `.env.example` — N/A (pas de DB pour ce sample)

**Author** : Dr Hamid MADANI <drmdh@msn.com>
