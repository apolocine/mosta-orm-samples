// Schéma User minimal — démontre EntitySchema + FieldType + FieldDef.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  // FieldDef avec required + unique. FieldType 'string' parmi
  // ('string'|'text'|'number'|'boolean'|'date'|'json'|'array').
  fields: {
    email: { type: 'string', required: true, unique: true },
    name:  { type: 'string' },
  },
  relations: {},
  indexes: [],
  timestamps: true,   // createdAt / updatedAt auto-gérés
}

// Type pour le BaseRepository<TUser>
export interface UserRow {
  id: string
  email: string
  name?: string
  createdAt?: Date
  updatedAt?: Date
}
