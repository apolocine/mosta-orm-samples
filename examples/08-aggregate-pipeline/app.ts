// Aggregate pipeline — $match + $group + $sort + $limit (MongoDB native).
//
// Démontre :
//   - aggregate() avec un AggregateStage[]
//   - AggregateMatchStage   : { $match: filter }
//   - AggregateGroupStage   : { $group: { _id: ..., field: accumulator } }
//   - AggregateAccumulator  : { $sum: 1 | '$field' }
//   - AggregateSortStage    : { $sort: { field: -1 } }
//   - AggregateLimitStage   : { $limit: N }
//
// Pourquoi MongoDB ici : le pipeline $match/$group/$sort/$limit est NATIF
// Mongo. SQLite ne mappe pas correctement l'expression '$customerId' vers
// une référence de colonne. Pour les dialects SQL, utiliser GROUP BY direct
// via $raw n'est pas encore standardisé — `aggregate()` reste optimal sur
// MongoDB en V1.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { createConnection, BaseRepository } from '@mostajs/orm'
import { OrderSchema, type OrderRow } from './schemas/order.schema.js'

async function main(): Promise<void> {
  console.log('─── Aggregate pipeline (MongoDB) — @mostajs/orm ───')

  const uri = process.env.SGBD_URI
    ?? 'mongodb://devuser:devpass26@[::1]:27017/sample-08-aggregate?authSource=admin'

  const dialect = await createConnection(
    { dialect: 'mongodb', uri, schemaStrategy: 'update' },
    [OrderSchema],
  )
  const orders = new BaseRepository<OrderRow>(OrderSchema, dialect)

  // Reset collection en mongo (équivalent du DROP TABLE en SQL).
  await orders.deleteMany({})

  // ── Seed : 15 commandes sur 3 clients × 3 statuses ──────────
  const data: Array<Partial<OrderRow>> = [
    { customerId: 'cust-a', status: 'completed', amount: 1000 },
    { customerId: 'cust-a', status: 'completed', amount: 2000 },
    { customerId: 'cust-a', status: 'pending',   amount:  500 },
    { customerId: 'cust-a', status: 'cancelled', amount:  300 },
    { customerId: 'cust-b', status: 'completed', amount: 1500 },
    { customerId: 'cust-b', status: 'pending',   amount:  700 },
    { customerId: 'cust-b', status: 'pending',   amount:  400 },
    { customerId: 'cust-b', status: 'cancelled', amount:  200 },
    { customerId: 'cust-c', status: 'completed', amount: 1500 },
    { customerId: 'cust-c', status: 'completed', amount: 1500 },
    { customerId: 'cust-c', status: 'completed', amount: 1500 },
    { customerId: 'cust-c', status: 'pending',   amount:  800 },
    { customerId: 'cust-c', status: 'pending',   amount:  600 },
    { customerId: 'cust-c', status: 'cancelled', amount:  100 },
    { customerId: 'cust-c', status: 'cancelled', amount:  100 },
  ]
  for (const d of data) await orders.create(d)
  console.log('✓ seeded 15 orders across 3 customers, statuses [completed,pending,cancelled]')

  // ── Pipeline 1 : top-N clients par CA (completed only) ──────
  console.log('─── Pipeline : top 3 customers par CA (completed only) ───')
  const topCustomers = await orders.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$customerId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 3 },
  ])
  for (const row of topCustomers) {
    console.log(`  - ${String(row._id).padEnd(8)} total=${String(row.total).padStart(6)}  count=${String(row.count).padStart(2)}`)
  }
  console.log(`✓ ${topCustomers.length} résultats triés desc`)
  if (topCustomers.length !== 3) throw new Error(`expected 3 top customers, got ${topCustomers.length}`)
  if (topCustomers[0]._id !== 'cust-c') throw new Error(`expected cust-c first, got ${topCustomers[0]._id}`)

  // ── Pipeline 2 : count par status (sans $match) ─────────────
  console.log('─── Pipeline : count par status ───')
  const byStatus = await orders.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])
  for (const row of byStatus) {
    console.log(`  - ${String(row._id).padEnd(12)} ${row.count}`)
  }
  console.log('✓ chaque status agrégé')
  if (byStatus.length !== 3) throw new Error(`expected 3 status groups, got ${byStatus.length}`)

  console.log('✅ Smoke OK — pipeline aggregate démontré sur MongoDB.')

  // Cleanup
  await orders.deleteMany({})
  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
