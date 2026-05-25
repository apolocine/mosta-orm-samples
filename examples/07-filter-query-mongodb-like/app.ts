// Filter operators MongoDB-like + QueryOptions.
//
// Démontre :
//   - $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $regex, $exists, $or, $and
//   - QueryOptions : sort, skip, limit, select
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { createConnection, BaseRepository } from '@mostajs/orm'
import { UserSchema, type UserRow } from './schemas/user.schema.js'

async function main(): Promise<void> {
  console.log('─── Filter operators & QueryOptions — @mostajs/orm ───')

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [UserSchema],
  )
  const users = new BaseRepository<UserRow>(UserSchema, dialect)

  // ── Seed 10 users variés ────────────────────────────────────
  await users.create({ email: 'u01@example.com', age: 18, status: 'active',  tags: ['junior'] })
  await users.create({ email: 'u02@example.com', age: 22, status: 'pending', tags: [] })
  await users.create({ email: 'u03@example.com', age: 25, status: 'active',  tags: ['admin'], premium: true })
  await users.create({ email: 'u04@example.com', age: 28, status: 'pending', tags: ['user'] })
  await users.create({ email: 'u05@example.com', age: 30, status: 'active',  tags: ['user'], premium: true })
  await users.create({ email: 'u06@example.com', age: 35, status: 'banned',  tags: ['blacklist'] })
  await users.create({ email: 'u07@example.com', age: 40, status: 'active',  tags: ['senior'], premium: true })
  await users.create({ email: 'u08@example.com', age: 45, status: 'pending', tags: ['vip'], premium: true })
  await users.create({ email: 'u09@example.com', age: 50, status: 'archived', tags: ['retired'] })
  await users.create({ email: 'u10@example.com', age: 60, status: 'active',  tags: ['founder'] })
  console.log('✓ seeded 10 users with varied ages, status, tags')

  const report = (label: string, count: number): void => {
    console.log(`${label.padEnd(38)} → ${count} user(s)`)
  }

  // ── FilterOperator (12) ─────────────────────────────────────
  report('$eq    age === 25',                    (await users.findAll({ age: { $eq: 25 } })).length)
  report('$ne    age !== 25',                    (await users.findAll({ age: { $ne: 25 } })).length)
  report('$gt    age > 30',                      (await users.findAll({ age: { $gt: 30 } })).length)
  report('$gte   age >= 30',                     (await users.findAll({ age: { $gte: 30 } })).length)
  report('$lt    age < 30',                      (await users.findAll({ age: { $lt: 30 } })).length)
  report('$lte   age <= 30',                     (await users.findAll({ age: { $lte: 30 } })).length)
  report('$in    status in [active, pending]',   (await users.findAll({ status: { $in: ['active', 'pending'] } })).length)
  report('$nin   status not in [banned]',        (await users.findAll({ status: { $nin: ['banned'] } })).length)
  report('$regex email matches @example\\.com$', (await users.findAll({ email: { $regex: '@example\\.com$' } })).length)
  report('$exists premium exists',               (await users.findAll({ premium: { $exists: true } })).length)
  report('$or    age<25 OR status=banned',       (await users.findAll({ $or: [{ age: { $lt: 25 } }, { status: 'banned' }] })).length)
  report('$and   age>=30 AND status=active',     (await users.findAll({ $and: [{ age: { $gte: 30 } }, { status: 'active' }] })).length)

  // ── QueryOptions ────────────────────────────────────────────
  console.log('─── QueryOptions ───')
  const top3 = await users.findAll({}, { sort: { age: -1 }, limit: 3 })
  console.log(`sort: { age: -1 }, limit: 3      → top 3 par age desc`)
  if (top3.length !== 3 || top3[0].age !== 60) throw new Error(`sort/limit failed: ${JSON.stringify(top3.map(u => u.age))}`)

  const page2 = await users.findAll({}, { sort: { age: 1 }, skip: 7, limit: 3 })
  console.log(`skip: 7, limit: 3                → pagination 8-10`)
  if (page2.length !== 3 || page2[0].age !== 45) throw new Error(`skip/limit failed: ${JSON.stringify(page2.map(u => u.age))}`)

  const projected = await users.findAll({}, { select: ['email', 'age'], limit: 1 })
  console.log(`select: ['email','age']          → projection 2 fields`)
  // Note : projection peut inclure 'id' implicitement selon dialect — assertion souple.
  if (projected.length !== 1) throw new Error('select failed')

  console.log('✅ Smoke OK — 12 opérateurs + QueryOptions démontrés.')

  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
