// Entity Schemas - barrel export
// Author: Dr Hamid MADANI drmdh@msn.com

// RBAC schemas — from @mostajs/rbac module (not local)
export { UserSchema, RoleSchema, PermissionSchema, PermissionCategorySchema } from '@mostajs/rbac';

// App-specific schemas (local)
export { ClientSchema } from './client.schema';
export { ActivitySchema } from './activity.schema';
export { SubscriptionPlanSchema } from './subscription-plan.schema';
export { ClientAccessSchema } from './client-access.schema';
export { TicketSchema } from './ticket.schema';
export { ScanLogSchema } from './scan-log.schema';
export { AuditLogSchema } from './audit-log.schema';
export { LockerSchema } from './locker.schema';
export { RfidTagSchema } from './rfid-tag.schema';
export { LockerEventSchema } from './locker-event.schema';
export { CounterSchema } from './counter.schema';
export { SettingSchema } from './setting.schema';
