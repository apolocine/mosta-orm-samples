// Entity Registry — registers all MostaParkManager schemas into @mostajs/orm
// Equivalent to Hibernate's entity_get_info() / EntityManagerFactory metadata
// En mode NET, registerSchemas est un no-op (les schemas sont sur le serveur NET)
// Author: Dr Hamid MADANI drmdh@msn.com
import { registerSchemas } from '@mostajs/orm';
import {
  UserSchema,
  ClientSchema,
  RoleSchema,
  PermissionSchema,
  PermissionCategorySchema,
  ActivitySchema,
  SubscriptionPlanSchema,
  ClientAccessSchema,
  TicketSchema,
  ScanLogSchema,
  AuditLogSchema,
  LockerSchema,
  RfidTagSchema,
  LockerEventSchema,
  CounterSchema,
  SettingSchema,
} from './schemas';

// Toujours enregistrer — en mode ORM ça initialise les tables,
// en mode NET ça ne fait que remplir le registry local (pas de DB)
registerSchemas([
  UserSchema,
  ClientSchema,
  RoleSchema,
  PermissionSchema,
  PermissionCategorySchema,
  ActivitySchema,
  SubscriptionPlanSchema,
  ClientAccessSchema,
  TicketSchema,
  ScanLogSchema,
  AuditLogSchema,
  LockerSchema,
  RfidTagSchema,
  LockerEventSchema,
  CounterSchema,
  SettingSchema,
]);
