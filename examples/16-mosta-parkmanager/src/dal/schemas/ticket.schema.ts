// Ticket Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const TicketSchema: EntitySchema = {
  name: 'Ticket',
  collection: 'tickets',
  timestamps: true,

  fields: {
    ticketNumber:  { type: 'string', unique: true },
    ticketType:    { type: 'string', enum: ['standard', 'cadeau'], default: 'standard' },
    qrCode:        { type: 'string', unique: true },
    clientName:    { type: 'string', required: true },
    activityName:  { type: 'string', required: true },
    validityMode:  { type: 'string', required: true },
    validUntil:    { type: 'date', default: null },
    status:        { type: 'string', enum: ['active', 'used', 'expired', 'cancelled'], default: 'active' },
    scannedAt:     { type: 'date', default: null },
    amount:        { type: 'number', required: true, default: 0 },
    currency:      { type: 'string', default: 'DA' },
    printCount:    { type: 'number', default: 0 },
  },

  relations: {
    client:       { target: 'Client', type: 'many-to-one', required: true },
    clientAccess: { target: 'ClientAccess', type: 'many-to-one', required: true },
    activity:     { target: 'Activity', type: 'many-to-one', required: true },
    sourceClient: { target: 'Client', type: 'many-to-one', nullable: true },
    scannedBy:    { target: 'User', type: 'many-to-one', nullable: true },
    createdBy:    { target: 'User', type: 'many-to-one', required: true },
  },

  indexes: [
    { fields: { client: 'asc' } },
    { fields: { status: 'asc' } },
    { fields: { validUntil: 'asc' } },
  ],
};
