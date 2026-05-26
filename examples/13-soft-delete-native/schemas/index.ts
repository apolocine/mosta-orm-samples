// Soft-delete natif — softDelete: true + sparse unique pour réinsertion.
//
// UserSchema : softDelete + index sparse sur email → réinsertion possible.
// CommentSchema : pas de softDelete (compare avec hard-delete).
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
  relations: {},
  // Index unique + sparse → bypasse les rows soft-deletées (R003B-safe)
  indexes: [{ fields: { email: 'asc' }, unique: true, sparse: true }],
  softDelete: true,
  timestamps: true,
}

export const CommentSchema: EntitySchema = {
  name: 'Comment',
  collection: 'comments',
  fields: {
    body:   { type: 'text', required: true },
    author: { type: 'string', required: true },
  },
  relations: {},
  indexes: [],
  // Pas de softDelete → delete() = DELETE physique.
  timestamps: true,
}

export interface UserRow {
  id: string
  email: string
  name: string
  deletedAt?: Date | null
}

export interface CommentRow {
  id: string
  body: string
  author: string
}
