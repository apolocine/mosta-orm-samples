// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  permissions: string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function PermissionGuard({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, isAdmin } = usePermissions()

  if (isAdmin()) return <>{children}</>

  const hasAccess = requireAll
    ? permissions.every((p) => hasPermission(p))
    : hasAnyPermission(permissions)

  if (!hasAccess) return <>{fallback}</>

  return <>{children}</>
}
