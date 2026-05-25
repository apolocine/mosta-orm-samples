// Schéma User identique au sample 01 — la portabilité dialect repose sur
// le fait que le SAME EntitySchema fonctionne pour tous les dialects SQL.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  fields: {
    email: { type: 'string', required: true, unique: true },
    name:  { type: 'string' },
  },
  relations: {},
  indexes: [{ fields: { email: 'asc' }, unique: true }],
  timestamps: true,
}

export interface UserRow {
  id: string
  email: string
  name?: string
  createdAt?: Date
  updatedAt?: Date
}
