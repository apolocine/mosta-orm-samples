// Schéma User partagé entre les tenants — la séparation est au niveau
// DB physique, pas au niveau schéma.
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
}
