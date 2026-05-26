// Audit-by-fields — DEFAULT_AUDIT_BY_FIELDS du validator (createdBy/updatedBy/…).
//
// DocSchema illustre le pattern : champs audit-by sur une entité critique.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const DocSchema: EntitySchema = {
  name: 'Doc',
  collection: 'docs',
  fields: {
    title: { type: 'string', required: true },
    body:  { type: 'text' },
    // Audit-by fields canoniques (cf. DEFAULT_AUDIT_BY_FIELDS du validator) :
    createdBy:   { type: 'string', required: true },
    updatedBy:   { type: 'string' },
    approvedBy:  { type: 'string' },
    scannedBy:   { type: 'string' },
    deletedBy:   { type: 'string' },
  },
  relations: {},
  indexes: [{ fields: { createdBy: 'asc' } }],
  softDelete: true,
  timestamps: true,
}

export interface DocRow {
  id: string
  title: string
  body?: string
  createdBy: string
  updatedBy?: string
  approvedBy?: string
  scannedBy?: string
  deletedBy?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}
