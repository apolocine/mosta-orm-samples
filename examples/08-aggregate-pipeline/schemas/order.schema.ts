// Schéma Order pour agrégation : customerId + status + amount.
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

export const OrderSchema: EntitySchema = {
  name: 'Order',
  collection: 'orders',
  fields: {
    customerId: { type: 'string', required: true },
    status:     { type: 'string', enum: ['completed', 'pending', 'cancelled'], required: true },
    amount:     { type: 'number', required: true },
  },
  relations: {},
  indexes: [
    { fields: { customerId: 'asc' } },
    { fields: { status: 'asc' } },
  ],
  timestamps: true,
}

export interface OrderRow {
  id: string
  customerId: string
  status: 'completed' | 'pending' | 'cancelled'
  amount: number
  createdAt?: Date
}
