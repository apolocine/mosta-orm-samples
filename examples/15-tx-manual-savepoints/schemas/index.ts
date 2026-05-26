// Tx manual savepoints — User + Account simple pour démontrer rollback/commit nested.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const AccountSchema: EntitySchema = {
  name: 'Account',
  collection: 'accounts',
  fields: {
    name:    { type: 'string', required: true, unique: true },
    balance: { type: 'number', required: true, default: 0 },
  },
  relations: {},
  indexes: [{ fields: { name: 'asc' }, unique: true }],
  timestamps: true,
}

export interface AccountRow {
  id: string
  name: string
  balance: number
}
