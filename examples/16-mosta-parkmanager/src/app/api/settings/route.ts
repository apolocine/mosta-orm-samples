// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { getSettings } from '@/lib/settings'
import { settingRepo } from '@/dal/service'

/** GET — any authenticated user can read settings (needed by client hooks) */
export async function GET() {
  const { error } = await checkAuth()
  if (error) return error

  const settings = await getSettings()
  return NextResponse.json({ data: settings })
}

/** PUT — admin only can write settings */
export async function PUT(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_SETTINGS)
  if (error) return error

  const repo = await settingRepo()
  const body = await req.json()

  for (const [key, value] of Object.entries(body)) {
    await repo.upsertByKey(key, value)
  }

  return NextResponse.json({ data: body })
}
