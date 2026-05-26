// Relations cascade — 4 RelationType + RelationDef exhaustif.
//
// User ←→ Profile         : 1-1 (orphanRemoval + cascade remove)
// User ←→ Posts           : 1-M (mappedBy côté inverse, cascade persist)
// Post ←→ Author (User)   : M-1 (joinColumn, onDelete:'cascade')
// Post ←→ Tags via PostTag: M-M (through, joinColumn + inverseJoinColumn)
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  fields: {
    email: { type: 'string', required: true, unique: true },
    name:  { type: 'string', required: true },
  },
  relations: {
    profile: {
      target: 'Profile',
      type: 'one-to-one',
      mappedBy: 'user',
      cascade: ['persist', 'remove'],
      orphanRemoval: true,
      nullable: true,
    },
    posts: {
      target: 'Post',
      type: 'one-to-many',
      mappedBy: 'author',
      cascade: ['persist'],
    },
  },
  indexes: [{ fields: { email: 'asc' }, unique: true }],
  timestamps: true,
}

export const ProfileSchema: EntitySchema = {
  name: 'Profile',
  collection: 'profiles',
  fields: {
    bio:    { type: 'text' },
    userId: { type: 'string', required: true, unique: true },  // FK exposée pour findOne({ userId })
  },
  relations: {
    user: {
      target: 'User',
      type: 'one-to-one',
      required: true,
      joinColumn: 'userId',
      onDelete: 'cascade',
    },
  },
  indexes: [{ fields: { userId: 'asc' }, unique: true }],
  timestamps: true,
}

export const PostSchema: EntitySchema = {
  name: 'Post',
  collection: 'posts',
  fields: {
    title:    { type: 'string', required: true },
    authorId: { type: 'string', required: true },  // FK exposée pour findAll({ authorId })
  },
  relations: {
    author: {
      target: 'User',
      type: 'many-to-one',
      required: true,
      joinColumn: 'authorId',
      onDelete: 'cascade',
    },
    tags: {
      target: 'Tag',
      type: 'many-to-many',
      through: 'PostTag',
      joinColumn: 'postId',
      inverseJoinColumn: 'tagId',
    },
  },
  indexes: [{ fields: { authorId: 'asc' } }],
  timestamps: true,
}

export const TagSchema: EntitySchema = {
  name: 'Tag',
  collection: 'tags',
  fields: {
    label: { type: 'string', required: true, unique: true },
  },
  relations: {},
  indexes: [{ fields: { label: 'asc' }, unique: true }],
  timestamps: true,
}

// Table de jointure M-M — explicite pour démontrer la mécanique.
// JAMAIS de cascade ['remove'|'all'] sur M-M (cf. piège llms.txt).
export const PostTagSchema: EntitySchema = {
  name: 'PostTag',
  collection: 'post_tags',
  fields: {
    postId: { type: 'string', required: true },
    tagId:  { type: 'string', required: true },
  },
  relations: {
    post: {
      target: 'Post',
      type: 'many-to-one',
      required: true,
      joinColumn: 'postId',
      onDelete: 'cascade',
    },
    tag: {
      target: 'Tag',
      type: 'many-to-one',
      required: true,
      joinColumn: 'tagId',
      onDelete: 'cascade',
    },
  },
  indexes: [{ fields: { postId: 'asc', tagId: 'asc' }, unique: true }],
  timestamps: true,
}

export interface UserRow {
  id: string
  email: string
  name: string
}
export interface ProfileRow {
  id: string
  bio?: string
  userId: string
}
export interface PostRow {
  id: string
  title: string
  authorId: string
}
export interface TagRow {
  id: string
  label: string
}
export interface PostTagRow {
  id: string
  postId: string
  tagId: string
}
