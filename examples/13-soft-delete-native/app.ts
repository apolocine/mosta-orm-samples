// Soft-delete natif — softDelete: true + sparse index + includeDeleted (2.2.0+).
//
// Démontre :
//   - softDelete:true injecte auto le champ deletedAt (Date|null)
//   - delete(id) devient soft-delete (UPDATE deletedAt = now)
//   - find/count/findOne sont auto-filtrés sur deletedAt IS NULL
//   - includeDeleted: true bypasse le filtre (2.2.0+)
//   - sparse: true sur unique index → réinsertion possible (R003B)
//   - Comparaison avec hard-delete (CommentSchema sans softDelete)
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  BaseRepository,
  clearRegistry,
  disconnectDialect,
} from '@mostajs/orm'
import {
  UserSchema, CommentSchema,
  type UserRow, type CommentRow,
} from './schemas/index.js'

async function main(): Promise<void> {
  console.log('═══ Soft-delete natif — @mostajs/orm ═══')

  clearRegistry()
  await disconnectDialect().catch(() => {})

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [UserSchema, CommentSchema],
  )
  const users = new BaseRepository<UserRow>(UserSchema, dialect)
  const comments = new BaseRepository<CommentRow>(CommentSchema, dialect)

  // ── 1. Seed : 2 users + 1 comment ──────────────────────────
  const alice = await users.create({ email: 'alice@example.com', name: 'Alice' })
  const bob   = await users.create({ email: 'bob@example.com',   name: 'Bob' })
  await comments.create({ body: 'Hello!', author: alice.id })
  console.log(`✓ seeded : 2 users + 1 comment`)

  // ── 2. delete(User) = soft-delete (UPDATE deletedAt) ────────
  console.log('─── delete(Alice) ───')
  await users.delete(alice.id)
  const total = await users.count({})
  const totalWithDeleted = await users.count({}, { includeDeleted: true })
  console.log(`   count() = ${total} (auto-filtré : seul Bob actif)`)
  console.log(`   count({ includeDeleted: true }) = ${totalWithDeleted} (Alice + Bob)`)
  if (total !== 1) throw new Error('Soft-delete : count auto-filtré devrait retourner 1')
  if (totalWithDeleted !== 2) throw new Error('includeDeleted devrait retourner 2')

  // ── 3. findOne (sur la soft-deletée) ────────────────────────
  console.log('─── findOne / findById sur Alice (soft-deleted) ───')
  const aliceLazy = await users.findOne({ email: 'alice@example.com' })
  const aliceById = await users.findById(alice.id)
  console.log(`   findOne({email}) = ${aliceLazy === null ? 'null' : 'object'}`)
  console.log(`   findById(aliceId) = ${aliceById === null ? 'null' : 'object'}`)
  if (aliceLazy !== null || aliceById !== null) throw new Error('Alice ne devrait pas être visible')

  const aliceForce = await users.findOne({ email: 'alice@example.com' }, { includeDeleted: true })
  console.log(`   findOne(email, includeDeleted) = Alice retrouvée, deletedAt=${aliceForce?.deletedAt ? 'set' : 'null'}`)
  if (!aliceForce?.deletedAt) throw new Error('deletedAt devrait être renseigné')

  // ── 4. Sparse unique : réinsertion email après soft-delete ─
  console.log('─── Réinsertion email — sparse unique (R003B) ───')
  const alice2 = await users.create({ email: 'alice@example.com', name: 'Alice (re-registered)' })
  console.log(`   ✓ Nouveau User '${alice2.name}' créé avec le même email (sparse:true sur unique)`)
  if (alice2.id === alice.id) throw new Error('Le nouvel id devrait différer du précédent')
  // L'ancien Alice (soft-deleted) coexiste toujours
  const allAlice = await users.findAll({ email: 'alice@example.com' }, { includeDeleted: true })
  console.log(`   ${allAlice.length} users avec cet email (1 active + 1 deleted) via includeDeleted`)
  if (allAlice.length !== 2) throw new Error('Devrait y avoir 2 rows pour ce mail (1 active + 1 soft-deleted)')

  // ── 5. Comparaison avec hard-delete ─────────────────────────
  console.log('─── Comparaison : hard-delete sur CommentSchema (sans softDelete) ───')
  const c1 = await comments.findOne({ author: alice.id })
  if (!c1) throw new Error('Le comment seed devrait exister')
  await comments.delete(c1.id)
  // Lookup direct : la row est PHYSIQUEMENT supprimée
  const rowsCount = await dialect.executeQuery!(`SELECT COUNT(*) as n FROM "comments"`, [])
  console.log(`   hard-delete : SELECT COUNT(*) FROM comments = ${rowsCount[0]?.n} (vs soft = row toujours là)`)
  if (Number(rowsCount[0]?.n) !== 0) throw new Error('Comment devrait être physiquement supprimé')

  await dialect.disconnect?.()
  console.log('✅ Smoke OK — softDelete + sparse + includeDeleted + comparaison hard-delete.')
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
