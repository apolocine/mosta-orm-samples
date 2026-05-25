// BaseRepository CRUD — 15 méthodes démontrées en séquence.
//
// Démontre :
//   - Read    : findAll, findOne, findById, count, distinct, search
//   - Write   : create, update, updateMany, upsert
//   - Delete  : delete, deleteMany
//   - Atomic  : increment, addToSet, pull
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { createConnection, BaseRepository } from '@mostajs/orm'
import { UserSchema, type UserRow } from './schemas/user.schema.js'

async function main(): Promise<void> {
  console.log('─── BaseRepository CRUD — @mostajs/orm ───')

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [UserSchema],
  )
  const users = new BaseRepository<UserRow>(UserSchema, dialect)

  // ── CREATE (×3) ─────────────────────────────────────────────
  const alice = await users.create({ email: 'alice@example.com', name: 'Alice' })
  const bob   = await users.create({ email: 'bob@example.com',   name: 'Bob'   })
  const charlie = await users.create({ email: 'charlie@example.com', name: 'Charlie' })
  console.log(`✓ create×3 — ${alice.name}, ${bob.name}, ${charlie.name}`)

  // ── READ : findAll / findOne / findById ──────────────────────
  const all = await users.findAll()
  const found = await users.findOne({ email: 'bob@example.com' })
  const byId = await users.findById(alice.id)
  console.log(`✓ findAll = ${all.length}, findOne(email='bob@…') = ${found?.name}, findById(aliceId) = ${byId?.name}`)
  if (all.length !== 3 || found?.name !== 'Bob' || byId?.name !== 'Alice') throw new Error('read assertions failed')

  // ── COUNT ───────────────────────────────────────────────────
  const total = await users.count({})
  console.log(`✓ count = ${total}`)

  // ── UPDATE / UPDATEMANY ─────────────────────────────────────
  await users.update(alice.id, { role: 'admin' })
  const aliceAdmin = await users.findById(alice.id)
  console.log(`✓ update(aliceId, {role:'admin'}) — Alice est ${aliceAdmin?.role}`)
  if (aliceAdmin?.role !== 'admin') throw new Error('update failed')

  const touched = await users.updateMany({ role: 'user' }, { active: true })
  console.log(`✓ updateMany(role='user', {active:true}) — ${touched} lignes touchées`)

  // ── DISTINCT ────────────────────────────────────────────────
  const roles = await users.distinct('role')
  console.log(`✓ distinct('role') = ${JSON.stringify(roles.sort())}`)

  // ── SEARCH ──────────────────────────────────────────────────
  const matches = await users.search('Char')
  console.log(`✓ search('Char') = ${matches.length} match (${matches[0]?.name})`)

  // ── UPSERT ──────────────────────────────────────────────────
  // upsert(filter, data) : findOne(filter) → si présent update(id, data),
  // sinon create(data). data doit donc contenir tous les `required`.
  const dave = await users.upsert(
    { email: 'dave@example.com' },
    { email: 'dave@example.com', name: 'Dave', role: 'guest' },
  )
  console.log(`✓ upsert(email='dave@…') → insert (id généré: ${dave?.id?.slice(0, 8)}…)`)

  // ── ATOMIC : INCREMENT ──────────────────────────────────────
  await users.increment(alice.id, 'loginCount', 1)
  const after1 = await users.findById(alice.id)
  console.log(`✓ increment(aliceId, 'loginCount', 1) → ${after1?.loginCount}`)

  await users.increment(alice.id, 'loginCount', 5)
  const after2 = await users.findById(alice.id)
  console.log(`✓ increment(aliceId, 'loginCount', 5) → ${after2?.loginCount}`)
  if (after2?.loginCount !== 6) throw new Error(`increment failed: ${after2?.loginCount}`)

  // ── ATOMIC : ADDTOSET ───────────────────────────────────────
  await users.addToSet(alice.id, 'tags', 'admin')
  await users.addToSet(alice.id, 'tags', 'editor')
  await users.addToSet(alice.id, 'tags', 'admin')   // idempotent (set)
  const aliceTags = await users.findById(alice.id)
  console.log(`✓ addToSet(aliceId, 'tags', 'editor') → ${JSON.stringify(aliceTags?.tags)}`)

  // ── ATOMIC : PULL ───────────────────────────────────────────
  await users.pull(alice.id, 'tags', 'admin')
  const aliceTagsAfter = await users.findById(alice.id)
  console.log(`✓ pull(aliceId, 'tags', 'admin') → ${JSON.stringify(aliceTagsAfter?.tags)}`)

  // ── DELETE / DELETEMANY ─────────────────────────────────────
  await users.delete(charlie.id)
  const afterDel = await users.count({})
  console.log(`✓ delete(charlieId) — ${afterDel}`)

  const deletedMany = await users.deleteMany({ role: 'user' })
  console.log(`✓ deleteMany({role:'user'}) — ${deletedMany}`)

  console.log('✅ Smoke OK — 15 méthodes BaseRepository démontrées.')

  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
