// Lazy vs eager fetch — démontre BREAKING 2.0 lazy default + opt-in eager.
//
// Project ←→ Registration (1-M / M-1 via mappedBy)
//   - ProjectSchema : pas de fetch déclaré → lazy par défaut (2.0+)
//   - ProjectEagerSchema : même schéma + `relations.project.fetch: 'eager'`
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const ProjectSchema: EntitySchema = {
  name: 'Project',
  collection: 'projects',
  fields: {
    slug: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
  },
  relations: {
    registrations: {
      target: 'Registration',
      type: 'one-to-many',
      mappedBy: 'project',
    },
  },
  indexes: [{ fields: { slug: 'asc' }, unique: true }],
  timestamps: true,
}

export const RegistrationLazySchema: EntitySchema = {
  name: 'Registration',
  collection: 'registrations',
  fields: {
    projectId: { type: 'string', required: true },
    email:     { type: 'string', required: true },
  },
  relations: {
    // Pas de `fetch` → lazy par défaut. findById retourne projectId string.
    project: {
      target: 'Project',
      type: 'many-to-one',
      required: true,
      joinColumn: 'projectId',
      onDelete: 'cascade',
    },
  },
  indexes: [],
  timestamps: true,
}

export const RegistrationEagerSchema: EntitySchema = {
  name: 'Registration',
  collection: 'registrations',
  fields: {
    projectId: { type: 'string', required: true },
    email:     { type: 'string', required: true },
  },
  relations: {
    // Eager opt-in : findById retourne project populé (objet).
    project: {
      target: 'Project',
      type: 'many-to-one',
      required: true,
      joinColumn: 'projectId',
      onDelete: 'cascade',
      fetch: 'eager',
    },
  },
  indexes: [],
  timestamps: true,
}

export interface ProjectRow {
  id: string
  slug: string
  name: string
}

export interface RegistrationRow {
  id: string
  projectId: string | { id: string; slug?: string; name?: string }
  email: string
  // En lazy : projectId est string.
  // En eager : la relation `project` est populée (objet Project) sur la propriété d'origine du joinColumn.
}
