// Schéma Article exhaustif — démontre chaque FieldType, chaque FieldDef
// option, chaque IndexType, plus discriminator et softDelete.
//
// C'est volontairement « tout-en-un » sur 1 schéma : le but est la
// référence rapide pour un dev qui cherche « comment exprimer X dans
// EntitySchema ». Ne PAS copier ce pattern en prod — un schéma métier
// réel n'utilise jamais TOUS les types à la fois.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const ArticleSchema: EntitySchema = {
  name: 'Article',
  collection: 'articles',

  // Single-table inheritance (Drupal-style node._type)
  discriminator: '_type',
  discriminatorValue: 'article',

  // Soft-delete natif (ajoute deletedAt + auto-filtre les rows soft-deleted)
  softDelete: true,

  // createdAt + updatedAt auto-gérés
  timestamps: true,

  fields: {
    // FieldType 'string' avec required + trim
    title: { type: 'string', required: true, trim: true },

    // FieldType 'string' + unique + lowercase (transformation auto)
    slug: { type: 'string', required: true, unique: true, lowercase: true },

    // FieldType 'text' (texte long, mapped TEXT en SQL)
    content: { type: 'text' },

    // FieldType 'number' avec default
    views: { type: 'number', default: 0 },

    // FieldType 'boolean' avec default
    published: { type: 'boolean', default: false },

    // FieldType 'date' (optionnel, peut être undefined)
    publishedAt: { type: 'date' },

    // FieldType 'json' (objet sérialisé en JSON column)
    metadata: { type: 'json' },

    // FieldType 'array' avec arrayOf (array of strings)
    tags: { type: 'array', arrayOf: { type: 'string' } },

    // FieldType 'string' + enum + default
    status: {
      type: 'string',
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },

  relations: {},

  indexes: [
    // IndexType 'asc' + unique + sparse (cohérent avec softDelete)
    { fields: { slug: 'asc' }, unique: true, sparse: true },

    // IndexType 'desc' (tri descendant prioritaire)
    { fields: { publishedAt: 'desc' } },

    // IndexType 'text' (full-text search en SQL/Mongo)
    { fields: { title: 'text' } },

    // Index composite (status, publishedAt) pour requêtes type
    // "tous les published triés par date"
    { fields: { status: 'asc', publishedAt: 'desc' } },
  ],
}

export interface ArticleRow {
  id: string
  _type?: string
  title: string
  slug: string
  content?: string
  views?: number
  published?: boolean
  publishedAt?: Date
  metadata?: Record<string, unknown>
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}
