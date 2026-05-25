// Schéma User varié pour exercer chaque FilterOperator.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  fields: {
    email:   { type: 'string', required: true, unique: true },
    age:     { type: 'number', required: true },
    status:  { type: 'string', enum: ['active', 'pending', 'banned', 'archived'], default: 'pending' },
    tags:    { type: 'array', arrayOf: { type: 'string' }, default: [] },
    premium: { type: 'boolean' },   // optionnel — pour $exists
  },
  relations: {},
  indexes: [{ fields: { email: 'asc' }, unique: true }],
  timestamps: true,
}

export interface UserRow {
  id: string
  email: string
  age: number
  status?: 'active' | 'pending' | 'banned' | 'archived'
  tags?: string[]
  premium?: boolean
  createdAt?: Date
  updatedAt?: Date
}
