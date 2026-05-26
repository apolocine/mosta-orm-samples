// Migration diff — diffSchemas + DiffOperation + generateMigrationSQL.
//
// Démontre :
//   - diff v1 (User basique) → v2 (User + phone + softDelete)
//   - diff v2 → v3 (ajout de Project)
//   - DiffOperation : addField, addSoftDelete, addEntity
//   - generateMigrationSQL : convertit les ops en ALTER TABLE / CREATE TABLE
//   - SchemaStrategy : 'validate' bloque si divergence ; 'update' migre auto
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  diffSchemas,
  generateMigrationSQL,
  createConnection,
  BaseRepository,
  clearRegistry,
  disconnectDialect,
} from '@mostajs/orm'
import { UserSchemaV1, UserSchemaV2, ProjectSchemaV3 } from './schemas/index.js'

async function main(): Promise<void> {
  console.log('═══ Migration diff — @mostajs/orm ═══')

  // ── Diff v1 → v2 ────────────────────────────────────────────
  console.log('─── Diff UserSchema v1 → v2 ───')
  const ops12 = diffSchemas([UserSchemaV1], [UserSchemaV2])
  console.log(`   ${ops12.length} opération(s) détectée(s) :`)
  for (const op of ops12) {
    if (op.type === 'addField') {
      console.log(`   • addField    : ${op.entity}.${op.field} (${op.def.type})`)
    } else if (op.type === 'addSoftDelete') {
      console.log(`   • addSoftDelete : ${op.entity} (inject deletedAt + auto-filter)`)
    } else {
      console.log(`   • ${op.type}     : ${JSON.stringify(op).slice(0, 80)}`)
    }
  }

  // ── SQL généré ─────────────────────────────────────────────
  console.log('─── SQL migration (dialect-agnostic) ───')
  const sql12 = generateMigrationSQL(ops12)
  for (const stmt of sql12) {
    console.log(`   ${stmt}`)
  }
  if (!sql12.some((s) => /ALTER TABLE/i.test(s))) {
    throw new Error('SQL devrait contenir au moins un ALTER TABLE')
  }

  // ── Diff v2 → v3 (ajout d'entité) ──────────────────────────
  console.log('─── Diff [UserV2] → [UserV2, ProjectV3] ───')
  const ops23 = diffSchemas([UserSchemaV2], [UserSchemaV2, ProjectSchemaV3])
  console.log(`   ${ops23.length} opération(s) détectée(s) :`)
  for (const op of ops23) {
    if (op.type === 'addEntity') {
      console.log(`   • addEntity   : ${op.schema.name} (collection: ${op.schema.collection})`)
    } else {
      console.log(`   • ${op.type}`)
    }
  }
  const sql23 = generateMigrationSQL(ops23)
  console.log(`   ${sql23.length} statement(s) SQL — extrait :`)
  console.log(`   ${sql23[0]?.slice(0, 100)}…`)
  if (!sql23.some((s) => /CREATE TABLE/i.test(s))) {
    throw new Error('SQL devrait contenir CREATE TABLE pour Project')
  }

  // ── SchemaStrategy : 'validate' bloque si divergence ─────
  console.log('─── SchemaStrategy: "validate" applique v2 sur DB en v1 ───')
  clearRegistry()
  await disconnectDialect().catch(() => {})

  // Création DB en v1
  const d1 = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [UserSchemaV1],
  )
  const users1 = new BaseRepository(UserSchemaV1, d1)
  await users1.create({ email: 'alice@example.com', name: 'Alice' })
  console.log(`   ✓ DB créée en v1, 1 user inséré`)
  await d1.disconnect?.()

  // Re-ouverture avec v2 + strategy='update' → table modifiée
  clearRegistry()
  await disconnectDialect().catch(() => {})
  const d2 = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'update' },
    [UserSchemaV2],
  )
  const users2 = new BaseRepository(UserSchemaV2, d2)
  // L'utilisateur existant reste accessible (le ALTER a ajouté la colonne)
  const alice = await users2.findOne({ email: 'alice@example.com' })
  console.log(`   ✓ strategy='update' migre : Alice retrouvée, phone=${alice?.phone ?? 'null'}`)
  if (!alice) throw new Error("Migration ratée : Alice introuvable après strategy=update")

  // On peut désormais utiliser le nouveau champ
  await users2.update(alice.id, { phone: '+33-1-23-45' })
  const updated = await users2.findOne({ email: 'alice@example.com' })
  console.log(`   ✓ Alice.phone='${updated?.phone}' (nouveau champ utilisable)`)
  if (updated?.phone !== '+33-1-23-45') throw new Error('Phone non persisté')

  await d2.disconnect?.()

  console.log('✅ Smoke OK — diffSchemas + DiffOperation + generateMigrationSQL + strategy update.')
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
