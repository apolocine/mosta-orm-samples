// Audit-by-fields — DEFAULT_AUDIT_BY_FIELDS pattern (8 fields canoniques).
//
// Démontre :
//   - Liste DEFAULT_AUDIT_BY_FIELDS exportée par @mostajs/orm/validator
//   - Pattern d'audit manuel via wrapper repository (le plus simple)
//   - Trace des actor sur create/update/approve/scan/soft-delete
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  BaseRepository,
  clearRegistry,
  disconnectDialect,
} from '@mostajs/orm'
import { DEFAULT_AUDIT_BY_FIELDS } from '@mostajs/orm/validator'
import { DocSchema, type DocRow } from './schemas/index.js'

/**
 * Helper "audit-aware" : injecte le champ audit-by approprié à chaque opération.
 * Pattern simple — l'écosystème de plugin/hook (cf. sample 16) automatise davantage.
 */
function audited(repo: BaseRepository<DocRow>) {
  return {
    create: (data: Partial<DocRow>, actor: string) =>
      repo.create({ ...data, createdBy: actor, updatedBy: actor }),
    update: (id: string, data: Partial<DocRow>, actor: string) =>
      repo.update(id, { ...data, updatedBy: actor }),
    approve: (id: string, actor: string) =>
      repo.update(id, { approvedBy: actor, updatedBy: actor }),
    scan: (id: string, actor: string) =>
      repo.update(id, { scannedBy: actor, updatedBy: actor }),
    softDelete: async (id: string, actor: string) => {
      // Marquer deletedBy AVANT le soft-delete (sinon le filter cache la row pour findById)
      await repo.update(id, { deletedBy: actor, updatedBy: actor })
      await repo.delete(id)
    },
  }
}

async function main(): Promise<void> {
  console.log('═══ Audit-by-fields — @mostajs/orm ═══')

  // ── 1. Champs audit-by canoniques exposés par le validator ────
  console.log('─── DEFAULT_AUDIT_BY_FIELDS (validateur) ───')
  console.log(`   ${DEFAULT_AUDIT_BY_FIELDS.length} champs canoniques :`)
  console.log(`   ${DEFAULT_AUDIT_BY_FIELDS.join(', ')}`)
  if (!DEFAULT_AUDIT_BY_FIELDS.includes('createdBy')) throw new Error("createdBy doit être dans DEFAULT_AUDIT_BY_FIELDS")
  if (!DEFAULT_AUDIT_BY_FIELDS.includes('approvedBy')) throw new Error("approvedBy doit être dans DEFAULT_AUDIT_BY_FIELDS")

  // ── 2. Setup ──────────────────────────────────────────────────
  clearRegistry()
  await disconnectDialect().catch(() => {})

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [DocSchema],
  )
  const docs = audited(new BaseRepository<DocRow>(DocSchema, dialect))

  // ── 3. Workflow audit complet ─────────────────────────────────
  console.log('─── Workflow : create → update → approve → scan → soft-delete ───')

  const doc = await docs.create({ title: 'TPS Report', body: 'Q1 2026' }, 'alice')
  console.log(`   ✓ create par 'alice' : createdBy='${doc.createdBy}', updatedBy='${doc.updatedBy}'`)
  if (doc.createdBy !== 'alice' || doc.updatedBy !== 'alice') throw new Error('create audit failed')

  const updated = await docs.update(doc.id, { body: 'Q1 2026 final' }, 'bob')
  console.log(`   ✓ update par 'bob'   : updatedBy='${updated?.updatedBy}' (createdBy inchangé='${updated?.createdBy}')`)
  if (updated?.updatedBy !== 'bob' || updated?.createdBy !== 'alice') throw new Error('update audit failed')

  const approved = await docs.approve(doc.id, 'charlie')
  console.log(`   ✓ approve par 'charlie' : approvedBy='${approved?.approvedBy}'`)
  if (approved?.approvedBy !== 'charlie') throw new Error('approve audit failed')

  const scanned = await docs.scan(doc.id, 'scanner-bot')
  console.log(`   ✓ scan par 'scanner-bot' : scannedBy='${scanned?.scannedBy}'`)
  if (scanned?.scannedBy !== 'scanner-bot') throw new Error('scan audit failed')

  await docs.softDelete(doc.id, 'eve')
  // findOne auto-filtré ne retrouve pas la row — récupération via includeDeleted
  const dialectAny = dialect as any
  const raw = await dialectAny.executeQuery(
    `SELECT createdBy, updatedBy, approvedBy, scannedBy, deletedBy, deletedAt FROM docs WHERE id = ?`,
    [doc.id],
  )
  const r = raw[0]
  console.log(`   ✓ softDelete par 'eve' : deletedBy='${r.deletedBy}', deletedAt=${r.deletedAt ? 'set' : 'null'}`)
  if (r.deletedBy !== 'eve' || !r.deletedAt) throw new Error('soft-delete audit failed')

  // ── 4. Bilan final : tous les 5 audit-by remplis ──────────────
  console.log('─── Bilan audit ───')
  console.log(`   createdBy   = '${r.createdBy}'`)
  console.log(`   updatedBy   = '${r.updatedBy}'`)
  console.log(`   approvedBy  = '${r.approvedBy}'`)
  console.log(`   scannedBy   = '${r.scannedBy}'`)
  console.log(`   deletedBy   = '${r.deletedBy}'`)

  await dialect.disconnect?.()
  console.log('✅ Smoke OK — DEFAULT_AUDIT_BY_FIELDS + pattern audit manuel via wrapper.')
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
