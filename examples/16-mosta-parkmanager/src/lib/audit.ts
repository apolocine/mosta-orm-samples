// Author: Dr Hamid MADANI drmdh@msn.com
import { auditLogRepo } from '@/dal/service'

interface AuditParams {
  userId: string
  userName: string
  userRole: string
  action: string
  module: string
  resource?: string
  resourceId?: string
  details?: any
  ipAddress?: string
  status?: 'success' | 'failure'
}

export async function logAudit(params: AuditParams) {
  try {
    const repo = await auditLogRepo()
    await repo.create({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      module: params.module,
      resource: params.resource || '',
      resourceId: params.resourceId || '',
      details: params.details || {},
      ipAddress: params.ipAddress || '',
      status: params.status || 'success',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Audit log error:', err)
  }
}

export function getAuditUser(session: any) {
  const { role, roles } = session.user as any
  return {
    userId: session.user.id,
    userName: session.user.name || session.user.email,
    userRole: role || (Array.isArray(roles) ? roles.join(', ') : 'unknown'),
  }
}
