// Schéma User avec champs pour exercer increment/addToSet/pull.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  fields: {
    email: { type: 'string', required: true, unique: true },
    name:  { type: 'string', required: true },
    role:  { type: 'string', enum: ['admin', 'user', 'guest'], default: 'user' },
    active: { type: 'boolean', default: false },
    loginCount: { type: 'number', default: 0 },
    tags:  { type: 'array', arrayOf: { type: 'string' }, default: [] },
  },
  relations: {},
  indexes: [{ fields: { email: 'asc' }, unique: true }],
  timestamps: true,
}

export interface UserRow {
  id: string
  email: string
  name: string
  role?: 'admin' | 'user' | 'guest'
  active?: boolean
  loginCount?: number
  tags?: string[]
  createdAt?: Date
  updatedAt?: Date
}
