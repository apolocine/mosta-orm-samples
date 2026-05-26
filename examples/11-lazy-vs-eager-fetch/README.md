# 11-lazy-vs-eager-fetch

> BREAKING 2.0 : toutes les relations sont `lazy` par défaut. `findById()` retourne la string id, pas l'objet populé. Démontre lazy + eager opt-in (`fetch: 'eager'`) + `findByIdWithRelations` + `extractRelId` (R019/R021-safe).

**Couvre** : `FetchType` (`'lazy'|'eager'`), `findByIdWithRelations`, `findWithRelations`,
**piège BREAKING 2.0 lazy/eager**, `extractRelId` en pratique (R019/R021).

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/11-lazy-vs-eager-fetch ~/my-fetch-app
cd ~/my-fetch-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./11-lazy-vs-eager-fetch.sh
```

## Expected output

```
═══ Lazy vs Eager Fetch — @mostajs/orm ═══
─── Lazy (default 2.0+) ────────────────────────────────────
   findById → typeof projectId = 'string' (attendu: string)
   reg.projectId === proj.id → true
   findByIdWithRelations → typeof project = 'object' (attendu: object)
   project.name='orphin' (populé)
─── Eager (opt-in via fetch:eager) ─────────────────────────
   findById (eager) → typeof project = 'object' (attendu: object)
   project.name='iquesta' (eager populé automatiquement)
   ⚠ reg.project === proj.id  → false (toujours false, c'est R021)
   ✓ extractRelId(reg.project) === proj.id → true (R019/R021-safe)
─── Helper extractRelId — cas limites ──────────────────────
   extractRelId('abc')         = 'abc'
   extractRelId({ id: 'abc' }) = 'abc'
   extractRelId(null)          = ''
   extractRelId(undefined)     = ''
✅ Smoke OK — lazy default + eager opt-in + findByIdWithRelations + extractRelId.
```

## What it shows

- **Lazy default** (2.0+) : `reg.projectId` est une string id — comparaisons
  `reg.projectId === proj.id` fonctionnent **en lazy**.
- **`findByIdWithRelations(id, ['project'])`** : populate explicite — la
  relation devient un objet `Project` complet.
- **`fetch: 'eager'`** côté `RelationDef` : `findById()` retourne directement
  la relation populée — **plus de comparaison directe possible** car
  `reg.project` est un objet, pas une string.
- **`extractRelId(value)`** : helper safe — fonctionne pour string, `{id}`,
  null, undefined. Recommandé par R019/R021 du validator.

**Piège R019/R021** : `entity.relation === stringValue` retourne toujours
`false` en eager (objet vs string). Le validator
`@mostajs/orm/validator` (R019, R021) auto-fixe en wrappant avec
`extractRelId(...)`.

## Files

- `app.ts` — démo lazy + eager + extractRelId
- `schemas/index.ts` — Project + Registration (lazy + eager variantes)
- `package.json` — déps : `@mostajs/orm` ≥ 2.2.1, `better-sqlite3`
- `11-lazy-vs-eager-fetch.sh` — script de lancement

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
