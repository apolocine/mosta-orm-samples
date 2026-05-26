// Seed admin — première étape obligatoire avant tout démarrage applicatif.
//
// Lit ADMIN_PASSWORD du .env si défini ; sinon génère un mot de passe
// aléatoire 16 caractères et l'imprime en console (lecture une seule fois).
//
// Idempotent : si l'admin existe déjà avec le même email, met à jour le
// password seulement si ADMIN_PASSWORD est explicitement défini.
//
// Usage :
//   ADMIN_EMAIL=admin@park.demo ADMIN_PASSWORD=changeMe123 npm run seed:admin
//   # ou sans variables : password généré + imprimé console
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { BaseRepository } from '@mostajs/orm'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { openOrm, logSeedHeader } from '../_common/bootstrap'
import { UserSchema } from '../_common/schemas'

interface UserRow {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
  status?: string
}

const ALL_ADMIN_PERMISSIONS = [
  'admin:access', 'admin:settings',
  'client:view', 'client:create', 'client:update', 'client:delete', 'client:search',
  'activity:view', 'activity:create', 'activity:update', 'activity:delete',
  'access:view', 'access:create', 'access:update', 'access:revoke',
  'ticket:create', 'ticket:view',
  'scan:validate', 'scan:view_history',
  'locker:view', 'locker:assign', 'locker:release', 'locker:manage',
  'rfid:view', 'rfid:program', 'rfid:deactivate', 'rfid:replace',
  'dashboard:view', 'dashboard:stats',
  'audit:view',
] as const

function generateRandomPassword(length = 16): string {
  // Caractères ambigus exclus (0/O, 1/l/I) pour lisibilité console
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return out
}

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL || 'admin@park.demo'
  const envPassword = process.env.ADMIN_PASSWORD
  const password = envPassword || generateRandomPassword()
  const isGenerated = !envPassword

  logSeedHeader('admin')
  console.log(`Email    : ${email}`)
  console.log(`Password : ${isGenerated ? '(généré aléatoire — voir ci-dessous)' : '(lu de ADMIN_PASSWORD env)'}`)
  console.log('')

  const dialect = await openOrm()
  const users = new BaseRepository<UserRow>(UserSchema, dialect)

  // Idempotent : update si existe avec ADMIN_PASSWORD explicite, sinon skip
  const existing = await users.findOne({ email })
  const hash = await bcrypt.hash(password, 10)

  if (existing) {
    if (envPassword) {
      await users.update(existing.id, { password: hash })
      console.log(`✓ Admin ${email} mis à jour (password réécrit depuis ADMIN_PASSWORD env)`)
    } else {
      console.log(`✓ Admin ${email} déjà présent — password non modifié (skip).`)
      console.log(`  Pour réinitialiser : ADMIN_PASSWORD=<nouveau> npm run seed:admin`)
    }
  } else {
    await users.create({
      email,
      password: hash,
      firstName: 'Admin',
      lastName: 'Park',
      role: 'admin',
      permissions: [...ALL_ADMIN_PERMISSIONS],
      status: 'active',
    })
    console.log(`✓ Admin ${email} créé.`)
  }

  if (isGenerated && !existing) {
    console.log('')
    console.log('═══ Mot de passe généré (à conserver — ne sera pas réaffiché) ═══')
    console.log('')
    console.log(`    ${password}`)
    console.log('')
    console.log('Connectez-vous puis modifiez ce mot de passe.')
  }

  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Seed admin failed:', err)
  process.exit(1)
})
