// Transactions manuelles + savepoints — beginTx/commitTx/rollbackTx + $transaction(cb).
//
// Démontre :
//   - $transaction(cb) : commit auto / rollback auto si throw
//   - beginTx/commitTx/rollbackTx : API manuelle pour tx spanning multi-fonctions
//   - TxHandle { id, startedAt, depth } : depth 1 = BEGIN réelle, depth 2+ = SAVEPOINT nested
//   - Isolation level passé en option (mappé par dialect — cf. llms.txt §PATTERNS)
//   - poolSize: 1 requis sur dialects SQL poolés (SQLite : pas de pool, ok par défaut)
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  BaseRepository,
  clearRegistry,
  disconnectDialect,
  type TxHandle,
} from '@mostajs/orm'
import { AccountSchema, type AccountRow } from './schemas/index.js'

async function main(): Promise<void> {
  console.log('═══ Transactions + savepoints — @mostajs/orm ═══')

  clearRegistry()
  await disconnectDialect().catch(() => {})

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [AccountSchema],
  )
  const accounts = new BaseRepository<AccountRow>(AccountSchema, dialect)

  await accounts.create({ name: 'alice', balance: 1000 })
  await accounts.create({ name: 'bob', balance: 500 })
  console.log('✓ Seed : alice=1000, bob=500')

  // ── 1. $transaction(cb) : commit auto sur retour normal ─────
  console.log('─── 1. $transaction(cb) : transfert OK → commit auto ───')
  await dialect.$transaction!(async () => {
    const alice = (await accounts.findOne({ name: 'alice' }))!
    const bob   = (await accounts.findOne({ name: 'bob' }))!
    await accounts.update(alice.id, { balance: alice.balance - 200 })
    await accounts.update(bob.id,   { balance: bob.balance + 200 })
  })
  let a1 = await accounts.findOne({ name: 'alice' })
  let b1 = await accounts.findOne({ name: 'bob' })
  console.log(`   alice=${a1?.balance}, bob=${b1?.balance} (attendu : alice=800, bob=700)`)
  if (a1?.balance !== 800 || b1?.balance !== 700) throw new Error('Tx commit failed')

  // ── 2. $transaction(cb) : throw → rollback auto ─────────────
  console.log('─── 2. $transaction(cb) : throw au milieu → rollback complet ───')
  try {
    await dialect.$transaction!(async () => {
      const alice = (await accounts.findOne({ name: 'alice' }))!
      await accounts.update(alice.id, { balance: alice.balance - 999 })  // applied
      throw new Error('Simulated failure (rollback expected)')
    })
  } catch (e) {
    if (!(e instanceof Error) || !/Simulated/.test(e.message)) throw e
    console.log(`   ✓ throw capturé : ${e.message}`)
  }
  const a2 = await accounts.findOne({ name: 'alice' })
  console.log(`   alice=${a2?.balance} (rollback → 800, pas -199)`)
  if (a2?.balance !== 800) throw new Error('Rollback failed')

  // ── 3. API manuelle : beginTx / commitTx / rollbackTx ───────
  console.log('─── 3. beginTx / commitTx (manuel, hors callback) ───')
  const tx: TxHandle = await dialect.beginTx!()
  console.log(`   TxHandle { id='${tx.id.slice(0, 8)}…', depth=${tx.depth}, startedAt=set }`)
  if (tx.depth !== 1) throw new Error('Outer tx should have depth=1')
  const aliceBefore = (await accounts.findOne({ name: 'alice' }))!
  await accounts.update(aliceBefore.id, { balance: aliceBefore.balance + 100 })
  await dialect.commitTx!(tx)
  const a3 = await accounts.findOne({ name: 'alice' })
  console.log(`   alice=${a3?.balance} (commit manuel : +100 → 900)`)
  if (a3?.balance !== 900) throw new Error('Manual commit failed')

  // ── 4. SAVEPOINT nested : beginTx → beginTx → commit/rollback inner ─
  console.log('─── 4. SAVEPOINT nested (depth 2+) ───')
  const outer: TxHandle = await dialect.beginTx!()
  console.log(`   outer  : depth=${outer.depth}`)
  const alice = (await accounts.findOne({ name: 'alice' }))!
  await accounts.update(alice.id, { balance: alice.balance + 50 })  // 900 → 950

  // Inner tx = SAVEPOINT
  const inner: TxHandle = await dialect.beginTx!()
  console.log(`   inner  : depth=${inner.depth} (SAVEPOINT)`)
  if (inner.depth < 2) throw new Error('Inner tx should have depth >= 2')
  await accounts.update(alice.id, { balance: 9999 })   // applied dans inner

  // Rollback inner uniquement → outer reste actif
  await dialect.rollbackTx!(inner)
  const aliceMid = (await accounts.findOne({ name: 'alice' }))!
  console.log(`   après rollback inner : alice=${aliceMid.balance} (devrait être 950, pas 9999)`)
  if (aliceMid.balance !== 950) throw new Error('Inner rollback should preserve outer mutation')

  // Commit outer → 950 persiste
  await dialect.commitTx!(outer)
  const a4 = await accounts.findOne({ name: 'alice' })
  console.log(`   après commit outer : alice=${a4?.balance} (devrait être 950)`)
  if (a4?.balance !== 950) throw new Error('Outer commit failed')

  // ── 5. Isolation level — passage au dialect ─────────────────
  console.log('─── 5. $transaction({ isolation: "SERIALIZABLE" }) sur SQLite ───')
  await dialect.$transaction!(async () => {
    await accounts.update(a4!.id, { balance: 1000 })
  }, { isolation: 'SERIALIZABLE' })
  // SQLite mappe SERIALIZABLE → BEGIN EXCLUSIVE TRANSACTION (cf. anomalie #5)
  const a5 = await accounts.findOne({ name: 'alice' })
  console.log(`   alice=${a5?.balance} (SERIALIZABLE → EXCLUSIVE pour SQLite, commit ok)`)
  if (a5?.balance !== 1000) throw new Error('Isolation tx failed')

  await dialect.disconnect?.()
  console.log('✅ Smoke OK — $transaction(cb) + manual beginTx + nested SAVEPOINT + isolation mapping.')
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
