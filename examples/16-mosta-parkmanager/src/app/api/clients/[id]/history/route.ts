// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { scanLogRepo, lockerEventRepo, auditLogRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.CLIENT_VIEW)
  if (error) return error

  const { id: clientId } = await params

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  const [slRepo, leRepo, alRepo] = await Promise.all([
    scanLogRepo(),
    lockerEventRepo(),
    auditLogRepo(),
  ])

  const [scans, lockerEvents, auditLogs] = await Promise.all([
    slRepo.findWithRelations(
      { client: clientId },
      ['activity', 'scannedBy'],
      { sort: { timestamp: -1 }, limit },
    ),
    leRepo.findWithRelations(
      { client: clientId },
      ['locker', 'performedBy'],
      { sort: { timestamp: -1 }, limit },
    ),
    alRepo.findByClientContext(clientId, { limit }),
  ])

  return NextResponse.json({
    data: {
      scans,
      lockerEvents,
      auditLogs,
    },
  })
}
