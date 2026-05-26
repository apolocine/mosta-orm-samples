// Schéma multi-type pour démontrer normalizeDoc + conversions dialect.
// Tous les FieldType présents — string/text/number/boolean/date/json/array.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const EventSchema: EntitySchema = {
  name: 'Event',
  collection: 'events',
  fields: {
    title:       { type: 'string', required: true, unique: true },
    description: { type: 'text' },
    capacity:    { type: 'number', required: true },
    isOpen:      { type: 'boolean', default: true },
    startsAt:    { type: 'date', required: true },         // ⚠️ dialect-dependent — voir output
    tags:        { type: 'array' },
    metadata:    { type: 'json' },
  },
  relations: {},
  indexes: [{ fields: { title: 'asc' }, unique: true }],
  timestamps: true,
}

export interface EventRow {
  id: string
  title: string
  description?: string
  capacity: number
  isOpen: boolean
  startsAt: Date | string
  tags?: string[]
  metadata?: Record<string, unknown>
  createdAt?: Date | string
  updatedAt?: Date | string
}
