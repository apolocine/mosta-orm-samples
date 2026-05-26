// Relations + cascade — 4 RelationType + CascadeType + OnDeleteAction.
//
// Démontre :
//   - 1-1   : User ←→ Profile (orphanRemoval + cascade remove)
//   - 1-M   : User ←→ Posts (cascade persist côté User)
//   - M-1   : Post → Author (joinColumn + onDelete:'cascade')
//   - M-M   : Post ←→ Tags via PostTag (through + join/inverseJoinColumn)
//   - Suppression cascade : delete User → Profile + Posts supprimés
//   - Pas de cascade catastrophe : delete Tag ne supprime pas le Post
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { createConnection, BaseRepository } from '@mostajs/orm'
import {
  UserSchema, ProfileSchema, PostSchema, TagSchema, PostTagSchema,
  type UserRow, type ProfileRow, type PostRow, type TagRow, type PostTagRow,
} from './schemas/index.js'

async function main(): Promise<void> {
  console.log('─── Relations + cascade — @mostajs/orm ───')

  const dialect = await createConnection(
    { dialect: 'sqlite', uri: './app.db', schemaStrategy: 'create' },
    [UserSchema, ProfileSchema, PostSchema, TagSchema, PostTagSchema],
  )

  const users    = new BaseRepository<UserRow>(UserSchema, dialect)
  const profiles = new BaseRepository<ProfileRow>(ProfileSchema, dialect)
  const posts    = new BaseRepository<PostRow>(PostSchema, dialect)
  const tags     = new BaseRepository<TagRow>(TagSchema, dialect)
  const postTags = new BaseRepository<PostTagRow>(PostTagSchema, dialect)

  // ── Seed : User + Profile (1-1) + 2 Posts (1-M) + 2 Tags + assoc M-M ──
  const alice = await users.create({ email: 'alice@example.com', name: 'Alice' })
  const profile = await profiles.create({ userId: alice.id, bio: 'Hello, world!' })
  const p1 = await posts.create({ title: 'First post',  authorId: alice.id })
  const p2 = await posts.create({ title: 'Second post', authorId: alice.id })
  const tagJs = await tags.create({ label: 'javascript' })
  const tagTs = await tags.create({ label: 'typescript' })
  await postTags.create({ postId: p1.id, tagId: tagJs.id })
  await postTags.create({ postId: p1.id, tagId: tagTs.id })
  await postTags.create({ postId: p2.id, tagId: tagTs.id })
  console.log(`✓ seeded : Alice + Profile + 2 Posts + 2 Tags + 3 PostTag rows`)

  // ── 1-1 : User ←→ Profile via joinColumn + onDelete:'cascade' ──
  console.log("─── 1-1 : User ←→ Profile")
  const profileOfAlice = await profiles.findOne({ userId: alice.id })
  if (!profileOfAlice || profileOfAlice.bio !== 'Hello, world!') throw new Error('1-1 lookup failed')
  console.log(`   → Profile.bio='${profileOfAlice.bio}' lié à User '${alice.name}'`)

  // ── 1-M : User → Posts (via authorId, mappedBy='author' côté User) ──
  console.log("─── 1-M : User → Posts")
  const postsOfAlice = await posts.findAll({ authorId: alice.id })
  console.log(`   → ${postsOfAlice.length} post(s) de '${alice.name}' (mappedBy='author')`)
  if (postsOfAlice.length !== 2) throw new Error('1-M count failed')

  // ── M-1 : Post → Author via joinColumn ──
  console.log("─── M-1 : Post → Author (joinColumn='authorId')")
  const postP1 = await posts.findById(p1.id)
  if (postP1?.authorId !== alice.id) throw new Error('M-1 fk failed')
  console.log(`   → Post '${postP1.title}' authorId='${alice.name}' (via joinColumn)`)

  // ── M-M : Post ←→ Tags via PostTag (through + join + inverseJoinColumn) ──
  console.log("─── M-M : Post ←→ Tags (through='PostTag')")
  const tagsOfP1 = await postTags.findAll({ postId: p1.id })
  console.log(`   → Post '${p1.title}' a ${tagsOfP1.length} tag(s) via table jointure`)
  if (tagsOfP1.length !== 2) throw new Error('M-M count failed')

  // ── Cascade onDelete:'cascade' : supprimer User → Profile + Posts disparaissent ──
  console.log("─── Cascade : delete User Alice")
  await users.delete(alice.id)
  const profileLeft = await profiles.findOne({ userId: alice.id })
  const postsLeft   = await posts.findAll({ authorId: alice.id })
  if (profileLeft !== null) throw new Error('Cascade : Profile should be deleted')
  if (postsLeft.length !== 0) throw new Error('Cascade : Posts should be deleted')
  console.log(`   → Profile supprimé : ${profileLeft === null} (onDelete:'cascade')`)
  console.log(`   → Posts supprimés  : ${postsLeft.length === 0} (onDelete:'cascade')`)

  // ── M-M : supprimer un Tag NE supprime PAS les Posts (pas de cascade 'all') ──
  console.log("─── Anti-cascade : delete Tag ne supprime PAS de Post")
  const orphanAuthor = await users.create({ email: 'bob@example.com', name: 'Bob' })
  const standalonePost = await posts.create({ title: 'Solo', authorId: orphanAuthor.id })
  const tagToDelete = await tags.create({ label: 'rust' })
  await postTags.create({ postId: standalonePost.id, tagId: tagToDelete.id })
  await tags.delete(tagToDelete.id)
  const postStillThere = await posts.findById(standalonePost.id)
  if (!postStillThere) throw new Error('Anti-cascade : Post must survive Tag deletion')
  const joinRowLeft = await postTags.findOne({ tagId: tagToDelete.id })
  if (joinRowLeft !== null) throw new Error('Anti-cascade : PostTag join row must cascade (FK on tagId)')
  console.log(`   → Post '${postStillThere.title}' survit à la suppression du Tag`)
  console.log(`   → La ligne PostTag est supprimée (FK onDelete:'cascade' sur join row)`)

  console.log('✅ Smoke OK — 4 relations + cascade + anti-cascade.')
  await dialect.disconnect?.()
}

main().catch((err) => {
  console.error('❌ Sample failed:', err)
  process.exit(1)
})
