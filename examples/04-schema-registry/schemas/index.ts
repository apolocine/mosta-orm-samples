// 3 schémas avec relations croisées pour démontrer validateSchemas() :
// User ← Project (many-to-one author) ← Registration (many-to-one project).
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User', collection: 'users',
  fields: { email: { type: 'string', required: true, unique: true } },
  relations: {}, indexes: [], timestamps: true,
}

export const ProjectSchema: EntitySchema = {
  name: 'Project', collection: 'projects',
  fields: { name: { type: 'string', required: true } },
  relations: {
    author: { type: 'many-to-one', target: 'User', onDelete: 'set-null' },
  },
  indexes: [], timestamps: true,
}

export const RegistrationSchema: EntitySchema = {
  name: 'Registration', collection: 'registrations',
  fields: { code: { type: 'string', required: true } },
  relations: {
    project: { type: 'many-to-one', target: 'Project', onDelete: 'cascade' },
  },
  indexes: [], timestamps: true,
}

export const TagSchema: EntitySchema = {
  name: 'Tag', collection: 'tags',
  fields: { label: { type: 'string', required: true, unique: true } },
  relations: {}, indexes: [], timestamps: true,
}
