// Schema registry — registre global indépendant du dialect.
//
// Démontre :
//   - registerSchema(s) / registerSchemas([…])
//   - getSchema, getSchemaByCollection, getAllSchemas, getEntityNames, hasSchema
//   - validateSchemas (vérifie les cibles de relations)
//   - clearRegistry + cycle de re-registration
//
// Pas besoin de connexion DB : le registre est purement en mémoire et
// peut être utilisé pour de l'introspection avant tout dialect.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  registerSchema,
  registerSchemas,
  getSchema,
  getSchemaByCollection,
  getAllSchemas,
  getEntityNames,
  hasSchema,
  validateSchemas,
  clearRegistry,
} from '@mostajs/orm'
import { UserSchema, ProjectSchema, RegistrationSchema, TagSchema } from './schemas/index.js'

async function main(): Promise<void> {
  console.log('─── Schema registry — @mostajs/orm ───')

  // Bonne pratique : clear avant en cas de re-run dans la même process.
  clearRegistry()

  // 1. registerSchemas — batch.
  registerSchemas([UserSchema, ProjectSchema, RegistrationSchema])
  const names = getEntityNames()
  console.log(`✓ 3 schémas enregistrés en batch : ${names.join(', ')}`)

  if (names.length !== 3) throw new Error(`expected 3 schemas, got ${names.length}`)

  // 2. getEntityNames — liste des noms enregistrés.
  console.log('✓ getEntityNames() =', names)

  // 3. hasSchema — check d'existence.
  console.log(`✓ hasSchema('User') = ${hasSchema('User')}`)
  if (!hasSchema('User')) throw new Error('User missing')

  // 4. getSchema — lookup par nom (throw si absent).
  console.log(`✓ getSchema('User').collection = '${getSchema('User').collection}'`)

  // 5. getSchemaByCollection — lookup par table/collection name.
  const byColl = getSchemaByCollection('projects')
  console.log(`✓ getSchemaByCollection('projects').name = '${byColl?.name}'`)

  // 6. getAllSchemas — récupère tous les schémas pour iteration.
  const all = getAllSchemas()
  if (all.length !== 3) throw new Error(`getAllSchemas count mismatch: ${all.length}`)

  // 7. validateSchemas — vérifie que les `target` des relations existent.
  const validation = validateSchemas()
  console.log('✓ validateSchemas() =', validation)
  if (!validation.valid) throw new Error(`validation failed: ${validation.errors.join(', ')}`)

  // 8. clearRegistry — vide tout. Utile en tests, dans les hot-reload, etc.
  clearRegistry()
  console.log(`✓ clearRegistry() → ${getEntityNames().length} schémas restants`)
  if (getEntityNames().length !== 0) throw new Error('clearRegistry failed')

  // 9. registerSchema unitaire — alternative au batch.
  registerSchema(TagSchema)
  console.log(`✓ ré-registerSchema('Tag') → hasSchema('Tag') = ${hasSchema('Tag')}`)

  console.log('✅ Smoke OK')
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
