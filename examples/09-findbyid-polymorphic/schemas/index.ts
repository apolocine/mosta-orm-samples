// Project : unique index sur slug → findById({ slug }) résout.
// Membership : unique index composite (projectId + role) → findById({ projectId, role }) résout.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const ProjectSchema: EntitySchema = {
  name: 'Project',
  collection: 'projects',
  fields: {
    slug: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
  },
  relations: {},
  // Index unique single — exploité par findById({ slug }).
  indexes: [{ fields: { slug: 'asc' }, unique: true }],
  timestamps: true,
}

export const MembershipSchema: EntitySchema = {
  name: 'Membership',
  collection: 'memberships',
  fields: {
    projectId: { type: 'string', required: true },
    role:      { type: 'string', enum: ['admin', 'editor', 'viewer'], required: true },
    userId:    { type: 'string', required: true },
  },
  relations: {},
  // Index unique composite — exploité par findById({ projectId, role }).
  indexes: [{ fields: { projectId: 'asc', role: 'asc' }, unique: true }],
  timestamps: true,
}

export interface ProjectRow {
  id: string
  slug: string
  name: string
}

export interface MembershipRow {
  id: string
  projectId: string
  role: 'admin' | 'editor' | 'viewer'
  userId: string
}
