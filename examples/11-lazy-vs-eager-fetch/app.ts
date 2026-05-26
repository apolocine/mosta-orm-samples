// Lazy vs eager fetch — BREAKING 2.0 + findByIdWithRelations + extractRelId.
//
// Démontre :
//   - Lazy default (2.0+) : reg.projectId est une string id, pas l'objet
//   - Populate explicite : findByIdWithRelations(id, ['project'])
//   - Eager opt-in       : `fetch: 'eager'` côté RelationDef
//   - extractRelId       : helper safe pour comparaisons en lazy OU eager (R019/R021)
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  BaseRepository,
  extractRelId,
  clearRegistry,
  disconnectDialect,
} from '@mostajs/orm'
import {
  ProjectSchema,
  RegistrationLazySchema,
  RegistrationEagerSchema,
  type ProjectRow,
  type RegistrationRow,
} from './schemas/index.js'

async function runLazy(): Promise<void> {
  console.log('─── Lazy (default 2.0+) ────────────────────────────────────')
  clearRegistry()
  await disconnectDialect().catch(() => {})

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './lazy.db', schemaStrategy: 'create' },
    [ProjectSchema, RegistrationLazySchema],
  )
  const projects = new BaseRepository<ProjectRow>(ProjectSchema, dialect)
  const regs     = new BaseRepository<RegistrationRow>(RegistrationLazySchema, dialect)

  const proj = await projects.create({ slug: 'orphin', name: 'orphin' })
  const reg  = await regs.create({ projectId: proj.id, email: 'a@b.c' })

  // Lecture lazy : projectId est la string id, pas l'objet
  const r1 = await regs.findById(reg.id)
  console.log(`   findById → typeof projectId = '${typeof r1?.projectId}' (attendu: string)`)
  if (typeof r1?.projectId !== 'string') throw new Error('Lazy : projectId devrait être string')
  console.log(`   reg.projectId === proj.id → ${r1?.projectId === proj.id}`)

  // Populate explicite via findByIdWithRelations
  const r2 = await regs.findByIdWithRelations(reg.id, ['project'])
  console.log(`   findByIdWithRelations → typeof project = '${typeof r2?.project}' (attendu: object)`)
  const popObj = r2?.project as unknown as ProjectRow | undefined
  if (!popObj || typeof popObj !== 'object') throw new Error('Populate : project devrait être objet')
  console.log(`   project.name='${popObj.name}' (populé)`)

  await dialect.disconnect?.()
}

async function runEager(): Promise<void> {
  console.log('─── Eager (opt-in via fetch:eager) ─────────────────────────')
  clearRegistry()
  await disconnectDialect().catch(() => {})

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './eager.db', schemaStrategy: 'create' },
    [ProjectSchema, RegistrationEagerSchema],
  )
  const projects = new BaseRepository<ProjectRow>(ProjectSchema, dialect)
  const regs     = new BaseRepository<RegistrationRow>(RegistrationEagerSchema, dialect)

  const proj = await projects.create({ slug: 'iquesta', name: 'iquesta' })
  const reg  = await regs.create({ projectId: proj.id, email: 'b@c.d' })

  // Eager : findById populent directement (sans demander relations)
  const r1 = await regs.findById(reg.id)
  console.log(`   findById (eager) → typeof project = '${typeof (r1 as any)?.project}' (attendu: object)`)
  const popObj = (r1 as any)?.project
  if (!popObj || typeof popObj !== 'object') throw new Error('Eager : project devrait être objet sans findByIdWithRelations')
  console.log(`   project.name='${popObj.name}' (eager populé automatiquement)`)

  // Piège R021 : reg.project === proj.id est TOUJOURS faux en eager (objet vs string id).
  console.log(`   ⚠ reg.project === proj.id  → ${(r1 as any).project === proj.id} (toujours false, c'est R021)`)
  console.log(`   ✓ extractRelId(reg.project) === proj.id → ${extractRelId((r1 as any).project) === proj.id} (R019/R021-safe)`)
  if (extractRelId((r1 as any).project) !== proj.id) throw new Error('extractRelId doit normaliser à string id')

  await dialect.disconnect?.()
}

async function main(): Promise<void> {
  console.log('═══ Lazy vs Eager Fetch — @mostajs/orm ═══')
  await runLazy()
  await runEager()

  // Demo extractRelId pure (string, objet populé, null, objet sans id)
  console.log('─── Helper extractRelId — cas limites ──────────────────────')
  console.log(`   extractRelId('abc')         = '${extractRelId('abc')}'`)
  console.log(`   extractRelId({ id: 'abc' }) = '${extractRelId({ id: 'abc' })}'`)
  console.log(`   extractRelId(null)          = '${extractRelId(null)}'`)
  console.log(`   extractRelId(undefined)     = '${extractRelId(undefined)}'`)

  console.log('✅ Smoke OK — lazy default + eager opt-in + findByIdWithRelations + extractRelId.')
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
