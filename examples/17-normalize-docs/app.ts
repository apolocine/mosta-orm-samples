// Normalisation — normalizeDoc + normalizeDocs + comportement conversions par dialect.
//
// Démontre :
//   1. BaseRepository applique normalizeDoc + deserializeField automatiquement
//   2. Mais en RAW (executeQuery), le retour SQLite contient des values non-converties
//   3. normalizeDoc traite _id → id + supprime __v (utile pour Mongo direct)
//   4. ⚠️ Piège dates SQLite : retour = string ISO, pas Date object
//   5. JSON / array / boolean sont bien convertis par deserializeField (SQL)
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  BaseRepository,
  normalizeDoc,
  normalizeDocs,
  clearRegistry,
  disconnectDialect,
} from '@mostajs/orm'
import { EventSchema, type EventRow } from './schemas/index.js'

async function main(): Promise<void> {
  console.log('═══ Normalisation — @mostajs/orm ═══')

  clearRegistry()
  await disconnectDialect().catch(() => {})

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [EventSchema],
  )
  const events = new BaseRepository<EventRow>(EventSchema, dialect)

  // ── 1. Seed avec tous les types ────────────────────────────
  const startsAt = new Date('2026-04-01T08:00:00.000Z')
  const created = await events.create({
    title: 'ParkOpening',
    description: 'Cérémonie d\'ouverture',
    capacity: 500,
    isOpen: true,
    startsAt,
    tags: ['vip', 'soiree'],
    metadata: { sponsor: 'Mosta', livestream: true },
  })
  console.log(`✓ Event créé : id='${created.id.slice(0, 8)}…'`)

  // ── 2. BaseRepository.findById — normalizeDoc + deserializeField auto ──
  console.log('─── (1) BaseRepository.findById → normalizeDoc + deserialize auto ───')
  const viaRepo = await events.findById(created.id)
  if (!viaRepo) throw new Error('Event introuvable')

  console.log(`   typeof isOpen   = '${typeof viaRepo.isOpen}'   → ${viaRepo.isOpen}`)
  console.log(`   typeof capacity = '${typeof viaRepo.capacity}' → ${viaRepo.capacity}`)
  console.log(`   typeof tags     = '${Array.isArray(viaRepo.tags) ? 'array' : typeof viaRepo.tags}' → ${JSON.stringify(viaRepo.tags)}`)
  console.log(`   typeof metadata = '${typeof viaRepo.metadata}' → ${JSON.stringify(viaRepo.metadata)}`)
  console.log(`   typeof startsAt = '${typeof viaRepo.startsAt}' → ${viaRepo.startsAt}`)
  console.log(`   startsAt instanceof Date ? ${viaRepo.startsAt instanceof Date}`)

  // Assertions sur les conversions effectives
  if (typeof viaRepo.isOpen !== 'boolean') throw new Error('boolean non converti')
  if (typeof viaRepo.capacity !== 'number') throw new Error('number non converti')
  if (!Array.isArray(viaRepo.tags)) throw new Error('array non parse')
  if (typeof viaRepo.metadata !== 'object') throw new Error('json non parse')

  // ⚠️ Sur SQLite, startsAt est une string ISO (pas un Date) — cf. llms.txt
  if (viaRepo.startsAt instanceof Date) {
    console.log(`   ✓ Date hydratée nativement (dialect Postgres/Mongo).`)
  } else if (typeof viaRepo.startsAt === 'string') {
    console.log(`   ⚠️  startsAt est STRING ISO (comportement SQLite — cf. llms.txt §NORMALISATION)`)
    console.log(`      Re-hydratation : new Date(val) → ${new Date(viaRepo.startsAt).toISOString()}`)
  }

  // ── 3. BaseRepository.findAll → normalizeDocs auto ──────────
  console.log('─── (2) BaseRepository.findAll → normalizeDocs auto ───')
  const list = await events.findAll({})
  console.log(`   findAll() = ${list.length} row(s), tous normalisés en bloc`)
  if (list.length !== 1) throw new Error('findAll devrait retourner 1 row')

  // ── 4. executeQuery RAW — sans normalize ────────────────────
  console.log('─── (3) executeQuery RAW (SQLite) — pas de deserialize, pas de normalize ───')
  const raw = await (dialect as any).executeQuery(
    `SELECT id, title, isOpen, capacity, tags, metadata, startsAt FROM events`,
    [],
  )
  const r = raw[0]
  console.log(`   typeof isOpen   = '${typeof r.isOpen}'   → ${JSON.stringify(r.isOpen)}     (RAW : 1, pas true)`)
  console.log(`   typeof tags     = '${typeof r.tags}'     → ${JSON.stringify(r.tags)?.slice(0, 50)}    (RAW : string JSON, pas array)`)
  console.log(`   typeof metadata = '${typeof r.metadata}' → ${JSON.stringify(r.metadata)?.slice(0, 60)}  (RAW : string JSON)`)
  console.log(`   typeof startsAt = '${typeof r.startsAt}' → ${JSON.stringify(r.startsAt)}`)

  if (typeof r.isOpen !== 'number') throw new Error('RAW SQLite : isOpen devrait être number 0/1')
  if (typeof r.tags !== 'string') throw new Error('RAW SQLite : tags devrait être string JSON')

  // ── 5. normalizeDoc manuel — démontre _id→id (Mongo) + récursion ──
  console.log('─── (4) normalizeDoc manuel — _id → id + suppression __v + récursion ───')
  const mongoDoc = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    __v: 3,
    name: 'Mongo style',
    nested: { _id: 'sub-id-xyz', __v: 0, label: 'child' },
    items: [
      { _id: 'item-1', value: 'A' },
      { _id: 'item-2', value: 'B' },
      'plain-string',           // non-object → passé tel quel
    ],
  }
  const normalized = normalizeDoc<any>(mongoDoc)
  console.log(`   _id        → id          : '${normalized.id}'`)
  console.log(`   __v supprimé             : ${!('__v' in normalized)}`)
  console.log(`   nested._id → nested.id   : '${normalized.nested.id}'`)
  console.log(`   nested.__v supprimé      : ${!('__v' in normalized.nested)}`)
  console.log(`   items[0]._id → items[0].id : '${normalized.items[0].id}'`)
  console.log(`   items[2] (string brut)   : '${normalized.items[2]}' (non touché)`)

  if (normalized.id !== '507f1f77bcf86cd799439011') throw new Error('_id non converti en id')
  if ('__v' in normalized) throw new Error('__v non supprimé')
  if (normalized.nested.id !== 'sub-id-xyz') throw new Error('Récursion nested ratée')
  if (normalized.items[0].id !== 'item-1') throw new Error('Récursion array ratée')

  // ── 6. normalizeDocs sur un array ──────────────────────────
  console.log('─── (5) normalizeDocs sur un array ───')
  const arrDocs = [
    { _id: 'a', name: 'A' },
    { _id: 'b', name: 'B' },
    { _id: 'c', name: 'C' },
  ]
  const normArr = normalizeDocs<any>(arrDocs)
  console.log(`   ${normArr.length} docs normalisés : ${normArr.map(d => `${d.id}=${d.name}`).join(', ')}`)
  if (normArr.length !== 3 || normArr[0].id !== 'a') throw new Error('normalizeDocs failed')

  // ── 7. Cas limites ─────────────────────────────────────────
  console.log('─── (6) Cas limites ───')
  console.log(`   normalizeDoc(null)      = ${normalizeDoc(null)}`)
  console.log(`   normalizeDoc(undefined) = ${normalizeDoc(undefined)}`)
  const noId = normalizeDoc<any>({ name: 'no-id', __v: 0 })
  console.log(`   normalizeDoc(obj sans _id ni id) → id = ${noId.id}, name = '${noId.name}'`)

  await dialect.disconnect?.()
  console.log('✅ Smoke OK — normalizeDoc + normalizeDocs + conversions par dialect (SQLite).')
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
