// Seed roles — crée 3 users supplémentaires (accueil, attraction, superviseur).
// L'admin est créé par 00_admin/seed-admin.ts.
// 100% @mostajs/orm — dialect-agnostic (SQLite, Mongo, Postgres, etc.).
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { BaseRepository } from '@mostajs/orm'
import bcrypt from 'bcryptjs'
import { openOrm, logSeedHeader } from '../_common/bootstrap'
import { UserSchema } from '../_common/schemas'

interface UserRow {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  permissions: string[]
  status?: string
}

const AGENT_ACCUEIL_PERMISSIONS = [
  'client:view', 'client:create', 'client:update', 'client:search',
  'activity:view',
  'access:view', 'access:create', 'access:update',
  'ticket:create', 'ticket:view',
  'scan:validate', 'scan:view_history',
  'locker:view', 'locker:assign', 'locker:release',
  'rfid:view', 'rfid:program', 'rfid:deactivate', 'rfid:replace',
  'dashboard:view',
]

const AGENT_ATTRACTION_PERMISSIONS = [
  'activity:view',
  'access:view',
  'ticket:view',
  'scan:validate',
  'locker:view',
]

const SUPERVISEUR_PERMISSIONS = [
  'client:view', 'client:search',
  'activity:view',
  'access:view',
  'ticket:view',
  'scan:view_history',
  'locker:view',
  'dashboard:view', 'dashboard:stats',
  'audit:view',
]

const seedUsers = [
  {
    email: 'accueil@park.demo',
    password: 'Agent@123456',
    firstName: 'Karim',
    lastName: 'Bensalem',
    phone: '0555000002',
    role: 'agent_accueil',
    permissions: AGENT_ACCUEIL_PERMISSIONS,
  },
  {
    email: 'attraction@park.demo',
    password: 'Agent@123456',
    firstName: 'Yacine',
    lastName: 'Mebarki',
    phone: '0555000003',
    role: 'agent_attraction',
    permissions: AGENT_ATTRACTION_PERMISSIONS,
  },
  {
    email: 'superviseur@park.demo',
    password: 'Super@123456',
    firstName: 'Nadia',
    lastName: 'Hamidi',
    phone: '0555000004',
    role: 'superviseur',
    permissions: SUPERVISEUR_PERMISSIONS,
  },
]

async function main(): Promise<void> {
  logSeedHeader('roles')

  const dialect = await openOrm()
  const users = new BaseRepository<UserRow>(UserSchema, dialect)

  for (const u of seedUsers) {
    const existing = await users.findOne({ email: u.email })
    if (existing) {
      console.log(`  - ${u.email} : déjà présent, skip.`)
      continue
    }
    const hashedPassword = await bcrypt.hash(u.password, 10)
    await users.create({
      email: u.email,
      password: hashedPassword,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      permissions: u.permissions,
      status: 'active',
    })
    console.log(`  ✓ ${u.email} créé (role=${u.role}, password=${u.password})`)
  }

  await dialect.disconnect?.()
  console.log('[Seed roles] OK')
}

main().catch((err) => {
  console.error('❌ Seed roles failed:', err)
  process.exit(1)
})
