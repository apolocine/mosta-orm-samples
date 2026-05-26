// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerRepo, lockerEventRepo, rfidTagRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.LOCKER_MANAGE)
  if (error) return error

  const { lockerId, notes } = await req.json()

  const lRepo = await lockerRepo()
  const locker = await lRepo.findById(lockerId)
  if (!locker) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouvé' } }, { status: 404 })
  }

  if (locker.currentTag) {
    const tRepo = await rfidTagRepo()
    const tagId = typeof locker.currentTag === 'object' ? locker.currentTag.id : locker.currentTag
    await tRepo.markLost(tagId)
  }

  const leRepo = await lockerEventRepo()
  await leRepo.create({
    locker: lockerId,
    client: locker.currentClient,
    rfidTag: locker.currentTag,
    eventType: 'tag_lost',
    performedBy: session!.user.id,
    notes,
  } as any)

  const updated = await lRepo.release(lockerId)

  await logAudit({
    ...getAuditUser(session!),
    action: 'tag_lost',
    module: 'lockers',
    resource: `Casier ${locker.zone}-${locker.number}`,
    resourceId: locker.id,
    details: { notes },
  })

  return NextResponse.json({ data: updated })
}
