// Author: Dr Hamid MADANI drmdh@msn.com
export const PERMISSIONS = {
  // Admin
  ADMIN_ACCESS: 'admin:access',
  ADMIN_SETTINGS: 'admin:settings',
  // Clients
  CLIENT_VIEW: 'client:view',
  CLIENT_CREATE: 'client:create',
  CLIENT_UPDATE: 'client:update',
  CLIENT_DELETE: 'client:delete',
  CLIENT_SEARCH: 'client:search',
  // Activities
  ACTIVITY_VIEW: 'activity:view',
  ACTIVITY_CREATE: 'activity:create',
  ACTIVITY_UPDATE: 'activity:update',
  ACTIVITY_DELETE: 'activity:delete',
  // Access (subscriptions/quotas)
  ACCESS_VIEW: 'access:view',
  ACCESS_CREATE: 'access:create',
  ACCESS_UPDATE: 'access:update',
  ACCESS_REVOKE: 'access:revoke',
  // Tickets
  TICKET_CREATE: 'ticket:create',
  TICKET_VIEW: 'ticket:view',
  // Scan
  SCAN_VALIDATE: 'scan:validate',
  SCAN_VIEW_HISTORY: 'scan:view_history',
  // Lockers
  LOCKER_VIEW: 'locker:view',
  LOCKER_ASSIGN: 'locker:assign',
  LOCKER_RELEASE: 'locker:release',
  LOCKER_MANAGE: 'locker:manage',
  // RFID
  RFID_VIEW: 'rfid:view',
  RFID_PROGRAM: 'rfid:program',
  RFID_DEACTIVATE: 'rfid:deactivate',
  RFID_REPLACE: 'rfid:replace',
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  // Audit
  AUDIT_VIEW: 'audit:view',
} as const

export const ROLES = {
  ADMIN: 'admin',
  AGENT_ACCUEIL: 'agent_accueil',
  AGENT_ATTRACTION: 'agent_attraction',
  SUPERVISEUR: 'superviseur',
} as const

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.AGENT_ACCUEIL]: [
    PERMISSIONS.CLIENT_VIEW,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.CLIENT_SEARCH,
    PERMISSIONS.ACTIVITY_VIEW,
    PERMISSIONS.ACCESS_VIEW,
    PERMISSIONS.ACCESS_CREATE,
    PERMISSIONS.ACCESS_UPDATE,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.SCAN_VALIDATE,
    PERMISSIONS.SCAN_VIEW_HISTORY,
    PERMISSIONS.LOCKER_VIEW,
    PERMISSIONS.LOCKER_ASSIGN,
    PERMISSIONS.LOCKER_RELEASE,
    PERMISSIONS.RFID_VIEW,
    PERMISSIONS.RFID_PROGRAM,
    PERMISSIONS.RFID_DEACTIVATE,
    PERMISSIONS.RFID_REPLACE,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
  [ROLES.AGENT_ATTRACTION]: [
    PERMISSIONS.ACTIVITY_VIEW,
    PERMISSIONS.ACCESS_VIEW,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.SCAN_VALIDATE,
    PERMISSIONS.LOCKER_VIEW,
  ],
  [ROLES.SUPERVISEUR]: [
    PERMISSIONS.CLIENT_VIEW,
    PERMISSIONS.CLIENT_SEARCH,
    PERMISSIONS.ACTIVITY_VIEW,
    PERMISSIONS.ACCESS_VIEW,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.SCAN_VIEW_HISTORY,
    PERMISSIONS.LOCKER_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false
  if (userPermissions.includes('*')) return true
  return userPermissions.includes(requiredPermission)
}

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || []
}

// getPermissionsForRoleFromDB has been moved to @/lib/permissions-server
// to avoid bundling mongoose in client components
