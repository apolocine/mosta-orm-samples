// Seed demo — données réalistes pour démonstration :
//   - 10 clients fictifs (5 abonnés + 5 visiteurs)
//   - 3 plans d'abonnement (Famille / Pack Sport / Premium)
//   - 5 ClientAccess (assignation des abonnés aux plans)
//   - 80 casiers (zones A, B, C)
//   - 10 tags RFID
//
// 100% @mostajs/orm — dialect-agnostic (SQLite, Mongo, Postgres, etc.).
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { BaseRepository } from '@mostajs/orm'
import { openOrm, logSeedHeader } from '../_common/bootstrap'
import {
  UserSchema,
  ActivitySchema,
  ClientSchema,
  ClientAccessSchema,
  SubscriptionPlanSchema,
  LockerSchema,
  RfidTagSchema,
  CounterSchema,
} from '../_common/schemas'

interface AnyRow { id: string; [k: string]: unknown }

const demoClients = [
  { firstName: 'Samir',   lastName: 'Boudjema', phone: '0550100001', email: 'samir.b@email.dz',  clientType: 'abonne',   gender: 'male',   wilaya: 'Alger',      dateOfBirth: new Date('1985-03-12') },
  { firstName: 'Amina',   lastName: 'Khelifi',  phone: '0550100002', email: 'amina.k@email.dz',  clientType: 'abonne',   gender: 'female', wilaya: 'Alger',      dateOfBirth: new Date('1992-07-25') },
  { firstName: 'Youcef',  lastName: 'Rahmani',  phone: '0550100003', email: 'youcef.r@email.dz', clientType: 'abonne',   gender: 'male',   wilaya: 'Blida',      dateOfBirth: new Date('1988-11-04') },
  { firstName: 'Leila',   lastName: 'Mansouri', phone: '0550100004', email: 'leila.m@email.dz',  clientType: 'abonne',   gender: 'female', wilaya: 'Tipaza',     dateOfBirth: new Date('1995-01-30') },
  { firstName: 'Mehdi',   lastName: 'Cherif',   phone: '0550100005', email: 'mehdi.c@email.dz',  clientType: 'abonne',   gender: 'male',   wilaya: 'Alger',      dateOfBirth: new Date('1980-09-17') },
  { firstName: 'Karima',  lastName: 'Benali',   phone: '0550100006', clientType: 'visiteur', gender: 'female', wilaya: 'Boumerdès', dateOfBirth: new Date('2001-05-08') },
  { firstName: 'Omar',    lastName: 'Djebbar',  phone: '0550100007', clientType: 'visiteur', gender: 'male',   wilaya: 'Alger',      dateOfBirth: new Date('1976-12-22') },
  { firstName: 'Fatima',  lastName: 'Zeroual',  phone: '0550100008', clientType: 'visiteur', gender: 'female', wilaya: 'Blida',      dateOfBirth: new Date('1990-04-14') },
  { firstName: 'Amine',   lastName: 'Belkacem', phone: '0550100009', clientType: 'visiteur', gender: 'male',   wilaya: 'Alger',      dateOfBirth: new Date('1998-08-03') },
  { firstName: 'Sarah',   lastName: 'Hamdani',  phone: '0550100010', clientType: 'visiteur', gender: 'female', wilaya: 'Tipaza',     dateOfBirth: new Date('2003-02-19') },
]

/** Génère un numéro client CLI-NNNNN incrémental via le repo Counter. */
async function getNextClientNumber(counters: BaseRepository<AnyRow>): Promise<string> {
  const existing = await counters.findOne({ id: 'client' })
  if (!existing) {
    await counters.create({ id: 'client', seq: 1 } as Partial<AnyRow>)
    return 'CLI-00001'
  }
  const next = ((existing.seq as number) ?? 0) + 1
  await counters.update(existing.id, { seq: next })
  return `CLI-${String(next).padStart(5, '0')}`
}

async function main(): Promise<void> {
  logSeedHeader('demo')

  const dialect = await openOrm()
  const users         = new BaseRepository<AnyRow>(UserSchema, dialect)
  const activities    = new BaseRepository<AnyRow>(ActivitySchema, dialect)
  const clients       = new BaseRepository<AnyRow>(ClientSchema, dialect)
  const accesses      = new BaseRepository<AnyRow>(ClientAccessSchema, dialect)
  const plans         = new BaseRepository<AnyRow>(SubscriptionPlanSchema, dialect)
  const lockers       = new BaseRepository<AnyRow>(LockerSchema, dialect)
  const tags          = new BaseRepository<AnyRow>(RfidTagSchema, dialect)
  const counters      = new BaseRepository<AnyRow>(CounterSchema, dialect)


  // Admin pour createdBy (requis par les schémas Client / ClientAccess)
  const adminUser = await users.findOne({ role: 'admin' })
  if (!adminUser) {
    console.error('  ✗ Admin introuvable. Lance `npm run seed:admin` d\'abord.')
    await dialect.disconnect?.()
    return
  }
  const adminId = adminUser.id as string

  // 1) Clients ────────────────────────────────────────────────
  console.log('─── Création des 10 clients ───')
  const createdClients: AnyRow[] = []
  for (const c of demoClients) {
    const clientNumber = await getNextClientNumber(counters)
    const client = await clients.create({
      ...c,
      clientNumber,
      qrCode: clientNumber,
      status: 'active',
      createdBy: adminId,
    } as Partial<AnyRow>)
    createdClients.push(client)
    console.log(`  ✓ ${clientNumber} : ${c.firstName} ${c.lastName} (${c.clientType})`)
  }

  // 3) Plans d'abonnement ──────────────────────────────────────
  console.log('─── Création des 3 plans ───')
  const acts = await activities.findAll({})
  const actBySlug = (slug: string) => acts.find((a) => a.slug === slug)
  const piscine = actBySlug('piscine')
  const tennis = actBySlug('tennis')
  const padel = actBySlug('padel')
  const football = actBySlug('football')
  const parcAttractions = actBySlug('parc-attractions')
  const espacesVerts = actBySlug('espaces-verts')
  const equitation = actBySlug('equitation')
  if (!piscine || !tennis || !padel || !football) {
    console.error('  ✗ Activités introuvables. Lance `npm run seed:activities` d\'abord.')
    await dialect.disconnect?.()
    return
  }

  const planDefs = [
    {
      name: 'Famille Mensuel',
      description: 'Abonnement famille : Piscine, Parc, Espaces Verts (30 jours)',
      type: 'temporal',
      duration: 30,
      activities: [
        { activity: piscine.id, sessionsCount: null },
        { activity: parcAttractions!.id, sessionsCount: null },
        { activity: espacesVerts!.id, sessionsCount: null },
      ],
      price: 5000,
    },
    {
      name: 'Pack Sport 15',
      description: '15 séances : Tennis, Padel, Football',
      type: 'usage',
      duration: null,
      activities: [
        { activity: tennis.id, sessionsCount: 15 },
        { activity: padel.id, sessionsCount: 15 },
        { activity: football.id, sessionsCount: 15 },
      ],
      price: 12000,
    },
    {
      name: 'Premium Mixte',
      description: '60 jours + quotas : Équitation 10, Piscine illimité, Tennis 20',
      type: 'mixed',
      duration: 60,
      activities: [
        { activity: equitation!.id, sessionsCount: 10 },
        { activity: piscine.id, sessionsCount: null },
        { activity: tennis.id, sessionsCount: 20 },
      ],
      price: 25000,
    },
  ]

  const createdPlans: AnyRow[] = []
  for (const p of planDefs) {
    const existing = await plans.findOne({ name: p.name })
    if (existing) {
      createdPlans.push(existing)
      console.log(`  - "${p.name}" déjà présent, skip.`)
    } else {
      const plan = await plans.create(p as Partial<AnyRow>)
      createdPlans.push(plan)
      console.log(`  ✓ "${p.name}" créé (${p.type})`)
    }
  }

  // 4) ClientAccess ────────────────────────────────────────────
  console.log('─── Assignation des accès aux abonnés ───')
  const now = new Date()
  const familyPlan = createdPlans[0]
  const sportPlan = createdPlans[1]
  const premiumPlan = createdPlans[2]

  // Helper : assignation Plan → toutes ses activités
  async function assignPlan(clientIdx: number, plan: AnyRow, accessType: string, durationDays: number | null): Promise<void> {
    const planActivities = (plan.activities as Array<{ activity: string; sessionsCount: number | null }>) || []
    for (const act of planActivities) {
      const realAccessType = accessType === 'mixed' && act.sessionsCount ? 'mixed' : accessType
      await accesses.create({
        client: createdClients[clientIdx].id,
        plan: plan.id,
        activity: act.activity,
        accessType: realAccessType,
        totalQuota: act.sessionsCount,
        remainingQuota: act.sessionsCount,
        startDate: now,
        endDate: durationDays ? new Date(now.getTime() + durationDays * 86400000) : null,
        status: 'active',
        createdBy: adminId,
      } as Partial<AnyRow>)
    }
  }

  await assignPlan(0, familyPlan, 'temporal', 30); console.log('  ✓ Samir   → Famille Mensuel')
  await assignPlan(1, sportPlan,  'count',    null); console.log('  ✓ Amina   → Pack Sport 15')
  await assignPlan(2, premiumPlan,'mixed',    60);   console.log('  ✓ Youcef  → Premium Mixte')
  await assignPlan(3, familyPlan, 'temporal', 30);   console.log('  ✓ Leila   → Famille Mensuel')
  await assignPlan(4, sportPlan,  'count',    null); console.log('  ✓ Mehdi   → Pack Sport 15')

  // 5) Casiers (80 lockers, 3 zones) ───────────────────────────
  console.log('─── Création des 80 casiers ───')
  const existingLockers = await lockers.count({})
  if (existingLockers > 0) {
    console.log(`  - ${existingLockers} casiers déjà présents, skip.`)
  } else {
    for (let i = 1; i <= 30; i++)   await lockers.create({ number: i, zone: 'A', status: 'available' } as Partial<AnyRow>)
    for (let i = 31; i <= 60; i++)  await lockers.create({ number: i, zone: 'B', status: 'available' } as Partial<AnyRow>)
    for (let i = 61; i <= 80; i++)  await lockers.create({ number: i, zone: 'C', status: 'available' } as Partial<AnyRow>)
    console.log('  ✓ 80 casiers créés (A: 1-30, B: 31-60, C: 61-80)')
  }

  // 6) Tags RFID ──────────────────────────────────────────────
  console.log('─── Création des 10 tags RFID ───')
  const existingTags = await tags.count({})
  if (existingTags > 0) {
    console.log(`  - ${existingTags} tags déjà présents, skip.`)
  } else {
    for (let i = 0; i < 10; i++) {
      await tags.create({ tagId: `ID-${String(782541 + i)}`, status: 'available' } as Partial<AnyRow>)
    }
    console.log('  ✓ 10 tags créés (ID-782541 à ID-782550)')
  }

  await dialect.disconnect?.()
  console.log('')
  console.log('[Seed demo] OK — 10 clients + 3 plans + 5 ClientAccess + 80 casiers + 10 RFID')
}

main().catch((err) => {
  console.error('❌ Seed demo failed:', err)
  process.exit(1)
})
