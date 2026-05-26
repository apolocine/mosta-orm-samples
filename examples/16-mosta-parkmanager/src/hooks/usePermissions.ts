// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useSession } from 'next-auth/react'
import { ROLES } from '@/lib/permissions'

export function usePermissions() {
  const { data: session } = useSession()

  const userPermissions: string[] = (session?.user as any)?.permissions || []
  const userRole: string = (session?.user as any)?.role || ''

  function hasPermission(permission: string): boolean {
    if (!userPermissions || userPermissions.length === 0) return false
    if (userPermissions.includes('*')) return true
    return userPermissions.includes(permission)
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => hasPermission(p))
  }

  function hasRole(role: string): boolean {
    return userRole === role
  }

  function isAdmin(): boolean {
    return userRole === ROLES.ADMIN
  }

  function canAccess(permission: string): boolean {
    if (isAdmin()) return true
    return hasPermission(permission)
  }

  return {
    permissions: userPermissions,
    role: userRole,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin,
    canAccess,
  }
}
