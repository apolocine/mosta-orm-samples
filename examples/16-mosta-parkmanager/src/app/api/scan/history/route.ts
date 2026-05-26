// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { scanLogRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.SCAN_VIEW_HISTORY)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const activityId = searchParams.get('activityId')
  const result = searchParams.get('result')

  const filter: any = {}
  if (activityId) filter.activity = activityId
  if (result) filter.result = result

  const repo = await scanLogRepo()
  const logs = await repo.findWithRelations(
    filter,
    ['ticket', 'scannedBy'],
    { sort: { timestamp: -1 }, limit },
  )

  return NextResponse.json({ data: logs })
}
