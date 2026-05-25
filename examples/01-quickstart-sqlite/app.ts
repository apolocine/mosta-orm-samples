// Quickstart SQLite — pattern de base de @mostajs/orm.
//
// Démontre la séquence minimale :
//   1. EntitySchema (fields + indexes + timestamps)
//   2. createConnection(config, [schema])
//   3. new BaseRepository<TRow>(schema, dialect)
//   4. create / findOne / count
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { createConnection, BaseRepository } from '@mostajs/orm'
import { UserSchema, type UserRow } from './schemas/user.schema.js'

async function main(): Promise<void> {
  console.log('─── Quickstart SQLite — @mostajs/orm ───')

  // 1. Connexion SQLite. schemaStrategy: 'update' crée/migre les tables.
  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'update' },
    [UserSchema],
  )
  console.log('✓ Connected to SQLite (./app.db)')

  // 2. BaseRepository typé.
  const users = new BaseRepository<UserRow>(UserSchema, dialect)

  // 3. Create — insère et retourne le row avec id généré.
  const created = await users.create({ email: 'alice@example.com', name: 'Alice' })
  console.log(`✓ User created (id=${created.id})`)

  // 4. findOne — lookup par n'importe quel field, retourne null si absent.
  const found = await users.findOne({ email: 'alice@example.com' })
  console.log('✓ findOne by email returned:', { id: found?.id, email: found?.email, name: found?.name })

  // 5. count — total des rows matching le filter.
  const total = await users.count({})
  console.log(`✓ count = ${total}`)

  // Assertions smoke pour le .sh
  if (!found || found.email !== 'alice@example.com') throw new Error('findOne assertion failed')
  if (total !== 1) throw new Error(`count expected 1, got ${total}`)

  console.log('✅ Smoke OK')

  // Cleanup connexion (le sample se termine, la DB ./app.db reste pour inspection)
  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
