// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerRepo, lockerEventRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.LOCKER_RELEASE)
  if (error) return error

  const { lockerId } = await req.json()

  const lRepo = await lockerRepo()
  const locker = await lRepo.findById(lockerId)
  if (!locker) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouvé' } }, { status: 404 })
  }
  if (locker.status !== 'occupied') {
    return NextResponse.json({ error: { code: 'INVALID', message: 'Casier non occupé' } }, { status: 400 })
  }

  const previousClient = locker.currentClient
  const previousTag = locker.currentTag

  const updated = await lRepo.release(lockerId)

  const leRepo = await lockerEventRepo()
  await leRepo.create({
    locker: lockerId,
    client: previousClient,
    rfidTag: previousTag,
    eventType: 'released',
    performedBy: session!.user.id,
  } as any)

  await logAudit({
    ...getAuditUser(session!),
    action: 'locker_release',
    module: 'lockers',
    resource: `Casier ${locker.zone}-${locker.number}`,
    resourceId: locker.id,
  })

  return NextResponse.json({ data: updated })
}
