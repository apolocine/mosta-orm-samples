// Isolated connections — multi-tenant via createIsolatedDialect + named connections.
//
// Démontre :
//   - Piège getDialect() singleton vs createIsolatedDialect()
//   - registerNamedConnection / getNamedConnection / listNamedConnections /
//     removeNamedConnection / clearNamedConnections
//
// Cas d'usage : SaaS multi-tenant où chaque client a sa propre DB.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createIsolatedDialect,
  registerNamedConnection,
  getNamedConnection,
  listNamedConnections,
  removeNamedConnection,
  clearNamedConnections,
  BaseRepository,
} from '@mostajs/orm'
import { UserSchema, type UserRow } from './schemas/user.schema.js'

async function main(): Promise<void> {
  console.log('─── Isolated connections — @mostajs/orm ───')

  // 1. Deux tenants = deux DB physiquement séparées. createIsolatedDialect
  //    bypass le singleton interne — chaque appel retourne une instance neuve.
  const dialectA = await createIsolatedDialect(
    { dialect: 'sqlite', uri: './tenant-a.db', schemaStrategy: 'update' },
    [UserSchema],
  )
  console.log('✓ tenant-a connecté à ./tenant-a.db')

  const dialectB = await createIsolatedDialect(
    { dialect: 'sqlite', uri: './tenant-b.db', schemaStrategy: 'update' },
    [UserSchema],
  )
  console.log('✓ tenant-b connecté à ./tenant-b.db')

  // 2. Registre nommé pour récupérer une connexion par nom métier.
  registerNamedConnection('tenant-a', dialectA)
  registerNamedConnection('tenant-b', dialectB)
  console.log('✓ named connections enregistrées :', listNamedConnections().join(', '))

  // 3. Repositories tirés depuis les named connections.
  const repoA = new BaseRepository<UserRow>(UserSchema, getNamedConnection('tenant-a')!)
  const repoB = new BaseRepository<UserRow>(UserSchema, getNamedConnection('tenant-b')!)

  // 4. Données différentes par tenant — preuve d'isolement.
  await repoA.create({ email: `a-${Date.now()}@tenant-a.example.com`, name: 'Alice A' })
  await repoB.create({ email: `b1-${Date.now()}@tenant-b.example.com`, name: 'Bob B1' })
  await repoB.create({ email: `b2-${Date.now()}@tenant-b.example.com`, name: 'Bob B2' })

  const countA = await repoA.count({})
  const countB = await repoB.count({})
  console.log(`✓ count tenant-a = ${countA}`)
  console.log(`✓ count tenant-b = ${countB}`)

  if (countA !== 1 || countB !== 2) {
    throw new Error(`isolation assertion failed: A=${countA}, B=${countB} (expected 1, 2)`)
  }
  console.log('✓ DBs physiquement distinctes (count diffère)')

  // 5. Cleanup — removeNamedConnection puis clearNamedConnections.
  removeNamedConnection('tenant-a')
  console.log(`✓ après remove tenant-a : ${listNamedConnections().join(', ') || '(vide)'}`)
  clearNamedConnections()
  console.log(`✓ après clearAll : ${listNamedConnections().length} connexions`)

  console.log('✅ Smoke OK')

  await dialectA.disconnect?.()
  await dialectB.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
