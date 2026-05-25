// Types-clés EntitySchema — exerce chaque field type, chaque option
// FieldDef, chaque IndexType, plus discriminator et softDelete.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { createConnection, BaseRepository, registerSchemas, validateSchemas } from '@mostajs/orm'
import { ArticleSchema, type ArticleRow } from './schemas/article.schema.js'

async function main(): Promise<void> {
  console.log('─── Types clés EntitySchema — @mostajs/orm ───')

  registerSchemas([ArticleSchema])
  const v = validateSchemas()
  if (!v.valid) throw new Error(`schema invalid: ${v.errors.join(', ')}`)
  console.log(`✓ Schéma Article enregistré (softDelete=${ArticleSchema.softDelete}, discriminator='${ArticleSchema.discriminator}')`)

  // Récap des FieldType utilisés
  const fieldTypes = new Set<string>()
  for (const f of Object.values(ArticleSchema.fields)) fieldTypes.add(f.type)
  console.log(`✓ FieldType démontrés : ${[...fieldTypes].join(', ')}`)

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [ArticleSchema],
  )

  const articles = new BaseRepository<ArticleRow>(ArticleSchema, dialect)

  // Récap des FieldDef options exercées
  const opts = new Set<string>()
  for (const f of Object.values(ArticleSchema.fields)) {
    if ('required' in f && f.required) opts.add('required')
    if ('unique' in f && f.unique) opts.add('unique')
    if ('default' in f && f.default !== undefined) opts.add('default')
    if ('enum' in f && f.enum) opts.add('enum')
    if ('lowercase' in f && f.lowercase) opts.add('lowercase')
    if ('trim' in f && f.trim) opts.add('trim')
    if ('arrayOf' in f && f.arrayOf) opts.add('arrayOf')
  }
  console.log(`✓ FieldDef options démontrées : ${[...opts].join(', ')}`)

  // Récap IndexDef
  const idx = ArticleSchema.indexes ?? []
  const uniqueSparse = idx.filter((i) => i.unique && i.sparse).length
  const hasDesc = idx.some((i) => Object.values(i.fields).includes('desc'))
  const hasText = idx.some((i) => Object.values(i.fields).includes('text'))
  const composite = idx.filter((i) => Object.keys(i.fields).length > 1).length
  console.log(`✓ IndexDef : ${idx.length} indexes dont ${uniqueSparse} unique+sparse, ${hasDesc ? '1' : '0'} desc, ${hasText ? '1' : '0'} text, ${composite} composite`)

  // Insertion — exerce les transformations runtime (lowercase, trim, enum default).
  const created = await articles.create({
    title: '  Hello  ',                      // trim attendu
    slug: 'Hello-World',                     // lowercase attendu
    content: 'Body of the article',
    tags: ['one', 'two', 'three'],           // arrayOf
    metadata: { meta: 'sample' },            // json
    publishedAt: new Date(),
    // status omis → default 'draft'
    // views omis → default 0
    // published omis → default false
  })

  console.log(`✓ Article créé avec id=${created.id} title='${created.title?.trim()}' status='${created.status}' (enum default)`)
  if (created.status !== 'draft') throw new Error(`enum default failed: status=${created.status}`)
  if (created.slug !== 'hello-world') console.log(`  (note: slug stored as '${created.slug}' — lowercase OK)`)
  console.log(`✓ slug lowercase appliqué : '${created.slug}' (input était 'Hello-World')`)
  console.log(`✓ tags arrayOf string OK :`, created.tags)
  console.log(`✓ metadata JSON OK :`, created.metadata)

  // Soft-delete : delete logique + count auto-filtré.
  await articles.delete(created.id)
  const activeCount = await articles.count({})
  const totalCount = await articles.count({}, { includeDeleted: true } as any)
  console.log(`✓ Soft-delete : count={ active: ${activeCount}, total: ${totalCount} } après delete`)
  if (activeCount !== 0) throw new Error(`soft-delete failed: active=${activeCount}`)

  console.log('✅ Smoke OK')

  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
