// Bootstrap commun aux seeds : connexion ORM via cascade @mostajs/config.
// 100% @mostajs/orm — pas d'accès SGBD direct (mongoose, better-sqlite3, …).
// Marche sur SQLite, MongoDB, PostgreSQL, MySQL, etc.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import {
  createConnection,
  getConfigFromEnv,
  registerSchemas,
  type IDialect,
} from '@mostajs/orm'
import {
  UserSchema,
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
} from './schemas'

const ALL_SCHEMAS = [
  UserSchema,
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
]

/**
 * Ouvre la connexion ORM en mode `schemaStrategy: 'update'` (crée les tables
 * manquantes, ne touche pas aux existantes). Idempotent — peut être appelé
 * plusieurs fois sur la même DB sans erreur.
 *
 * Retourne le dialect ; le caller appellera `dialect.disconnect?.()` à la fin.
 */
export async function openOrm(): Promise<IDialect> {
  const config = getConfigFromEnv()
  // Register dans le registry global @mostajs/orm — initSchema l'utilisera
  registerSchemas(ALL_SCHEMAS)
  // SCHEMA_STRATEGY override depuis l'env (utile pour reset complet en CLI
  // — ex. SCHEMA_STRATEGY=create-drop drop+recreate les tables sample 16
  // sans toucher aux autres apps cohabitant sur le DB).
  const strategy = (process.env.SCHEMA_STRATEGY ?? 'update') as
    | 'none' | 'create' | 'update' | 'create-drop'
  const dialect = await createConnection(
    { ...config, schemaStrategy: strategy },
    ALL_SCHEMAS,
  )
  return dialect
}

export function logSeedHeader(name: string): void {
  const config = getConfigFromEnv()
  console.log(`═══ Seed ${name} — mosta-parkmanager ═══`)
  console.log(`Dialect : ${config.dialect}`)
  console.log(`URI     : ${config.uri.replace(/:[^@]+@/, ':***@')}`)
  console.log('')
}
