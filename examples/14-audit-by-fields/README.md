# 14-audit-by-fields

> Pattern d'audit-by sur les 8 champs canoniques exposés par `@mostajs/orm/validator` (`DEFAULT_AUDIT_BY_FIELDS`). Wrapper repository pour injecter automatiquement les `createdBy/updatedBy/approvedBy/scannedBy/deletedBy/…` à chaque opération.

**Couvre** : `DEFAULT_AUDIT_BY_FIELDS` (constant export du validator), pattern wrapper audit manuel, workflow create/update/approve/scan/soft-delete avec acteurs distincts.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/14-audit-by-fields ~/my-audit-app
cd ~/my-audit-app
rm -rf ../tmp
```

## External resources

aucune *(SQLite via better-sqlite3)*.

## Run

```bash
./14-audit-by-fields.sh
```

## Expected output

```
═══ Audit-by-fields — @mostajs/orm ═══
─── DEFAULT_AUDIT_BY_FIELDS (validateur) ───
   8 champs canoniques :
   createdBy, updatedBy, deletedBy, archivedBy, validatedBy, scannedBy, reviewedBy, approvedBy
─── Workflow : create → update → approve → scan → soft-delete ───
   ✓ create par 'alice' : createdBy='alice', updatedBy='alice'
   ✓ update par 'bob'   : updatedBy='bob' (createdBy inchangé='alice')
   ✓ approve par 'charlie' : approvedBy='charlie'
   ✓ scan par 'scanner-bot' : scannedBy='scanner-bot'
   ✓ softDelete par 'eve' : deletedBy='eve', deletedAt=set
─── Bilan audit ───
   createdBy   = 'alice'
   updatedBy   = 'bob' / 'charlie' / 'scanner-bot' / 'eve'  (selon dernière opération)
   approvedBy  = 'charlie'
   scannedBy   = 'scanner-bot'
   deletedBy   = 'eve'
✅ Smoke OK — DEFAULT_AUDIT_BY_FIELDS + pattern audit manuel via wrapper.
```

## What it shows

- **`DEFAULT_AUDIT_BY_FIELDS`** — constant exporté par `@mostajs/orm/validator`,
  liste les 8 champs canoniques : `createdBy`, `updatedBy`, `deletedBy`,
  `archivedBy`, `validatedBy`, `scannedBy`, `reviewedBy`, `approvedBy`.
- **Pattern wrapper** — l'`audited(repo)` enrichit `create/update/approve/scan/softDelete`
  pour injecter automatiquement le bon champ audit-by selon l'opération. Pas de
  hook ORM nécessaire (cf. sample 16 pour la version plugin/hook).
- **`createdBy` immuable** — préservé même après plusieurs `update`.
- **`deletedBy` set avant soft-delete** — sinon le filtre auto-applique
  `deletedAt IS NULL` et `update` ne trouverait pas la row.
- **Validator R010** — alerte si une entité audit-critique manque les
  audit-by déclarés ; `R016` alerte si `…By` field stocke un email plain
  string au lieu d'un user id.

## Files

- `app.ts` — démo wrapper audit + workflow complet
- `schemas/index.ts` — DocSchema avec 5 audit-by + softDelete + timestamps
- `package.json` — déps : `@mostajs/orm` ≥ 2.2.5, `better-sqlite3`
- `14-audit-by-fields.sh` — script de lancement

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>
