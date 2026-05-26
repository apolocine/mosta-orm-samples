// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerRepo, lockerEventRepo, clientRepo, rfidTagRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.LOCKER_ASSIGN)
  if (error) return error

  const { lockerId, clientId, tagId } = await req.json()

  const lRepo = await lockerRepo()
  const locker = await lRepo.findById(lockerId)
  if (!locker) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouvé' } }, { status: 404 })
  }
  if (locker.status !== 'available') {
    return NextResponse.json({ error: { code: 'INVALID', message: 'Casier non disponible' } }, { status: 400 })
  }

  const cRepo = await clientRepo()
  const client = await cRepo.findById(clientId)
  if (!client) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Client non trouvé' } }, { status: 404 })
  }

  let rfidTagId = null
  if (tagId) {
    const tRepo = await rfidTagRepo()
    const tag = await tRepo.findById(tagId)
    rfidTagId = tag?.id || null
  }

  const updated = await lRepo.assign(lockerId, clientId, rfidTagId || null)

  const leRepo = await lockerEventRepo()
  await leRepo.create({
    locker: lockerId,
    client: clientId,
    rfidTag: rfidTagId,
    eventType: 'assigned',
    performedBy: session!.user.id,
  } as any)

  await logAudit({
    ...getAuditUser(session!),
    action: 'locker_assign',
    module: 'lockers',
    resource: `Casier ${locker.zone}-${locker.number}`,
    resourceId: locker.id,
    details: { clientId, clientName: `${client.firstName} ${client.lastName}` },
  })

  return NextResponse.json({ data: updated })
}
