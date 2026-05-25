// Multi-dialect switch — un seul code, plusieurs SGBD via .env.
//
// Démontre :
//   - getSupportedDialects() : énumération des dialects supportés
//   - getDialectConfig(name) : métadata d'un dialect (driver, etc.)
//   - getConfigFromEnv() : lit DB_DIALECT + SGBD_URI depuis .env
//   - createConnection(config) : config-driven, dialect-agnostic
//   - getCurrentDialectType() : type du dialect actuellement connecté
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  getConfigFromEnv,
  getSupportedDialects,
  getDialectConfig,
  getCurrentDialectType,
  BaseRepository,
} from '@mostajs/orm'
import { UserSchema, type UserRow } from './schemas/user.schema.js'

async function main(): Promise<void> {
  console.log('─── Multi-dialect switch — @mostajs/orm ───')

  // 1. Liste exhaustive des dialects supportés par la version installée.
  console.log('\nDialects supportés :')
  for (const name of getSupportedDialects()) {
    const cfg = getDialectConfig(name)
    console.log(`  - ${name.padEnd(12)} ${cfg?.label ?? cfg?.driver ?? ''}`)
  }

  // 2. Config lue depuis .env (DB_DIALECT + SGBD_URI). Si rien n'est défini,
  // on fournit un fallback sqlite local — utile pour la première exécution
  // sans configurer .env.
  let config
  try {
    config = getConfigFromEnv()
  } catch {
    console.log('\nℹ DB_DIALECT non défini — fallback SQLite local.')
    config = { dialect: 'sqlite' as const, uri: './app.db' }
  }
  config.schemaStrategy = 'update'

  console.log('\n✓ Config courante :', config)

  // 3. Connexion sur le dialect choisi.
  const dialect = await createConnection(config, [UserSchema])
  const currentDialect = getCurrentDialectType()
  console.log(`✓ Connecté à : ${currentDialect}`)

  // 4. Le code applicatif est strictement le même quel que soit le SGBD.
  const users = new BaseRepository<UserRow>(UserSchema, dialect)
  const email = `multi-${currentDialect}-${Date.now()}@example.com`
  const created = await users.create({ email, name: 'MultiDialect' })
  console.log(`✓ User créé sur ${currentDialect} (id=${created.id})`)

  const found = await users.findOne({ email })
  if (!found) throw new Error('findOne failed after create')

  console.log('✅ Smoke OK — le même code marche sur n\'importe quel dialect.')

  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
