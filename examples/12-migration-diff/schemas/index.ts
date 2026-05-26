// Migration diff — UserSchema v1 → v2, démontre les opérations diffSchemas
//
// v1 : email + name
// v2 : email + name + phone (added) + softDelete activé
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const UserSchemaV1: EntitySchema = {
  name: 'User',
  collection: 'users',
  fields: {
    email: { type: 'string', required: true, unique: true },
    name:  { type: 'string', required: true },
  },
  relations: {},
  indexes: [{ fields: { email: 'asc' }, unique: true }],
  timestamps: true,
}

export const UserSchemaV2: EntitySchema = {
  name: 'User',
  collection: 'users',
  fields: {
    email: { type: 'string', required: true, unique: true },
    name:  { type: 'string', required: true },
    phone: { type: 'string' },  // ← added field
  },
  relations: {},
  indexes: [{ fields: { email: 'asc' }, unique: true }],
  timestamps: true,
  softDelete: true,  // ← added soft-delete
}

// Nouvelle entité Project en v3 (pas v1)
export const ProjectSchemaV3: EntitySchema = {
  name: 'Project',
  collection: 'projects',
  fields: {
    slug: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
  },
  relations: {},
  indexes: [{ fields: { slug: 'asc' }, unique: true }],
  timestamps: true,
}
