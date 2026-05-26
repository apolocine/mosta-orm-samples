// Schémas partagés par tous les seeds — dialect-agnostic via @mostajs/orm.
// Réutilise les définitions applicatives quand possible, en y ajoutant le
// UserSchema local (qui est dans @mostajs/rbac/server côté runtime mais que
// les seeds doivent re-déclarer pour rester standalone CLI).
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { EntitySchema } from '@mostajs/orm'

// Re-export des schémas applicatifs (réutilisation de src/dal/schemas/)
export {
  ActivitySchema,
  ClientSchema,
  ClientAccessSchema,
  SubscriptionPlanSchema,
  LockerSchema,
  RfidTagSchema,
  CounterSchema,
  TicketSchema,
  ScanLogSchema,
  AuditLogSchema,
  LockerEventSchema,
  SettingSchema,
} from '../../src/dal/schemas'

// UserSchema — minimal, suffisant pour les seeds. Cohérent avec le seed-admin
// déjà existant ; à terme alignable avec @mostajs/rbac/server.
export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  fields: {
    email:     { type: 'string', required: true, unique: true, sparse: true, lowercase: true, trim: true },
    password:  { type: 'string', required: true },
    firstName: { type: 'string', required: true },
    lastName:  { type: 'string', required: true },
    phone:     { type: 'string' },
    role:      { type: 'string', required: true },
    permissions: { type: 'array' },
    status:    { type: 'string', default: 'active' },
    lastLoginAt: { type: 'date' },
  },
  relations: {},
  indexes: [],
  timestamps: true,
  softDelete: true,
}
