// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { auditLogRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.AUDIT_VIEW)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const module = searchParams.get('module') || undefined
  const action = searchParams.get('action') || undefined
  const userId = searchParams.get('userId') || undefined
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const repo = await auditLogRepo()
  const { data: logs, total } = await repo.findPaginated(
    {
      module,
      action,
      userId,
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo + 'T23:59:59.999Z') : undefined,
    },
    { sort: { timestamp: -1 }, skip: (page - 1) * limit, limit },
  )

  return NextResponse.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
