// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerEventRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.LOCKER_VIEW)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const lockerId = searchParams.get('lockerId')
  const limit = parseInt(searchParams.get('limit') || '50')

  const repo = await lockerEventRepo()

  const filter: any = {}
  if (lockerId) filter.locker = lockerId

  const events = await repo.findWithRelations(
    filter,
    ['client', 'performedBy'],
    { sort: { timestamp: -1 }, limit },
  )

  return NextResponse.json({ data: events })
}
