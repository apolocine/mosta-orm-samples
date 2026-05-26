// DAL Service — centralized repository access
// Uses @mostajs/data-plug — ORM or NET resolved automatically per cascade config
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { getDialect } from '@mostajs/data-plug'

// RBAC repositories — from @mostajs/rbac module (not local)
import { UserRepository, RoleRepository, PermissionRepository, PermissionCategoryRepository } from '@mostajs/rbac/server';

// App-specific repositories (local)
import { ClientRepository } from './repositories/client.repository';
import { ActivityRepository } from './repositories/activity.repository';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { ClientAccessRepository } from './repositories/client-access.repository';
import { TicketRepository } from './repositories/ticket.repository';
import { ScanLogRepository } from './repositories/scan-log.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { LockerRepository } from './repositories/locker.repository';
import { RfidTagRepository } from './repositories/rfid-tag.repository';
import { LockerEventRepository } from './repositories/locker-event.repository';
import { SettingRepository } from './repositories/setting.repository';

// ── Dialect resolution — one line, octoswitcher handles ORM/NET ──

async function dialect() {
  // Side-effect: registers all schemas into @mostajs/orm registry (ORM mode)
  await import('./registry');
  return getDialect();
}

// ── Repository factories ────────────────────────────

export async function userRepo() { return new UserRepository(await dialect()); }
export async function clientRepo() { return new ClientRepository(await dialect()); }
export async function roleRepo() { return new RoleRepository(await dialect()); }
export async function permissionRepo() { return new PermissionRepository(await dialect()); }
export async function permissionCategoryRepo() { return new PermissionCategoryRepository(await dialect()); }
export async function activityRepo() { return new ActivityRepository(await dialect()); }
export async function subscriptionPlanRepo() { return new SubscriptionPlanRepository(await dialect()); }
export async function clientAccessRepo() { return new ClientAccessRepository(await dialect()); }
export async function ticketRepo() { return new TicketRepository(await dialect()); }
export async function scanLogRepo() { return new ScanLogRepository(await dialect()); }
export async function auditLogRepo() { return new AuditLogRepository(await dialect()); }
export async function lockerRepo() { return new LockerRepository(await dialect()); }
export async function rfidTagRepo() { return new RfidTagRepository(await dialect()); }
export async function lockerEventRepo() { return new LockerEventRepository(await dialect()); }
export async function settingRepo() { return new SettingRepository(await dialect()); }
