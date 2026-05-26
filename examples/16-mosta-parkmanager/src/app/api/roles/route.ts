// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server'
import { checkPermission } from '@/lib/authCheck'
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const roles = Object.entries(ROLES).map(([key, value]) => ({
    key,
    name: value,
    permissions: ROLE_PERMISSIONS[value] || [],
  }))

  return NextResponse.json({ data: roles })
}
