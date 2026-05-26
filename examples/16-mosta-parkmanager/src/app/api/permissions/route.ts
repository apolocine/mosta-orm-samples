// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const permissions = Object.entries(PERMISSIONS).map(([key, value]) => ({
    key,
    name: value,
    category: value.split(':')[0],
  }))

  return NextResponse.json({ data: permissions })
}
