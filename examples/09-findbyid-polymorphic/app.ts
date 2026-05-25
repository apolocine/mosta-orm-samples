// findById polymorphique — 4 formes + extractRelId + OrmIntrospectionError.
//
// Démontre :
//   Forme 1 : findById('id-string')                — PK direct (legacy)
//   Forme 2 : findById({ id: '...' })              — objet contenant id
//   Forme 3 : findById({ slug: '...' })            — natural key single
//   Forme 4 : findById({ projectId, role })        — composite natural key
//   Erreur  : findById({ unknown: 'foo' })         — OrmIntrospectionError
//   Helper  : extractRelId(val)                    — normalise vers string id
//
// Introspection : resolveLookup + findMatchingUniqueIndex (utilisés en
// interne par findById). Disponibles publiquement pour debug ou outillage.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  BaseRepository,
  extractRelId,
  OrmIntrospectionError,
  resolveLookup,
} from '@mostajs/orm'
import {
  ProjectSchema, MembershipSchema,
  type ProjectRow, type MembershipRow,
} from './schemas/index.js'

async function main(): Promise<void> {
  console.log('─── findById polymorphique + extractRelId — @mostajs/orm ───')

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [ProjectSchema, MembershipSchema],
  )

  const projects = new BaseRepository<ProjectRow>(ProjectSchema, dialect)
  const memberships = new BaseRepository<MembershipRow>(MembershipSchema, dialect)

  // ── Seed ────────────────────────────────────────────────────
  const proj = await projects.create({ slug: 'orphin', name: 'orphin' })
  await memberships.create({ projectId: proj.id, role: 'admin', userId: 'user-1' })
  console.log("✓ seeded : Project 'orphin' + Membership (admin sur Project 'orphin')")

  // ── Forme 1 : string PK direct ──────────────────────────────
  console.log("─── Forme 1 : findById('id-string')")
  const p1 = await projects.findById(proj.id)
  console.log(`   → Project name='${p1?.name}'`)
  if (!p1) throw new Error('Forme 1 failed')

  // ── Forme 2 : objet avec id (cas d'une relation populée) ────
  console.log("─── Forme 2 : findById({ id: '…' })")
  const p2 = await projects.findById({ id: proj.id })
  console.log(`   → Project name='${p2?.name}'`)
  if (!p2 || p2.id !== proj.id) throw new Error('Forme 2 failed')

  // ── Forme 3 : natural key single (slug unique) ──────────────
  console.log("─── Forme 3 : findById({ slug }) — natural key single")
  const p3 = await projects.findById({ slug: 'orphin' })
  console.log(`   → Project name='${p3?.name}' via unique index { slug }`)
  if (!p3 || p3.id !== proj.id) throw new Error('Forme 3 failed')

  // ── Forme 4 : composite natural key ─────────────────────────
  console.log("─── Forme 4 : findById({ projectId, role }) — composite natural key")
  const m4 = await memberships.findById({ projectId: proj.id, role: 'admin' })
  console.log(`   → Membership found via unique index { projectId+role }`)
  if (!m4) throw new Error('Forme 4 failed')

  // ── Erreur typée : ni id ni unique index matching ───────────
  console.log("─── Erreur typée : findById({ unknown: 'foo' })")
  try {
    await projects.findById({ unknown: 'foo' })
    throw new Error('Expected OrmIntrospectionError, none thrown')
  } catch (e) {
    if (!(e instanceof OrmIntrospectionError)) throw e
    console.log(`   → OrmIntrospectionError schema='${e.schemaName}' availableFields=[${e.availableFields.join(', ')}]`)
  }

  // ── extractRelId helper ─────────────────────────────────────
  console.log("─── Helper extractRelId")
  console.log(`   extractRelId('abc')                 = '${extractRelId('abc')}'`)
  console.log(`   extractRelId({ id: 'abc' })         = '${extractRelId({ id: 'abc' })}'`)
  console.log(`   extractRelId(null)                  = '${extractRelId(null)}'`)
  console.log(`   extractRelId({ slug: 'foo' })       = '${extractRelId({ slug: 'foo' })}'  (pas d'id direct)`)

  // ── Bonus : resolveLookup public pour debug/outillage ───────
  const resolved = resolveLookup(ProjectSchema, { slug: 'orphin' })
  if (resolved.kind !== 'natural') throw new Error(`expected kind 'natural', got '${resolved.kind}'`)

  console.log('✅ Smoke OK — 4 formes findById + extractRelId + error typing.')

  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
