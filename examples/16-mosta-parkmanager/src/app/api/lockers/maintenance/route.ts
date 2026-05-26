// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerRepo, lockerEventRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.LOCKER_MANAGE)
  if (error) return error

  const { lockerId, action, notes } = await req.json()

  const lRepo = await lockerRepo()
  const locker = await lRepo.findById(lockerId)
  if (!locker) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouvé' } }, { status: 404 })
  }

  const leRepo = await lockerEventRepo()

  if (action === 'start') {
    if (locker.status === 'occupied') {
      return NextResponse.json(
        { error: { code: 'INVALID', message: 'Libérez le casier avant de le mettre en maintenance' } },
        { status: 400 }
      )
    }
    if (locker.status === 'maintenance') {
      return NextResponse.json(
        { error: { code: 'INVALID', message: 'Casier déjà en maintenance' } },
        { status: 400 }
      )
    }

    await lRepo.setMaintenance(lockerId)

    await leRepo.create({
      locker: lockerId,
      eventType: 'maintenance_start',
      performedBy: session!.user.id,
      notes,
    } as any)

    await logAudit({
      ...getAuditUser(session!),
      action: 'locker_maintenance_start',
      module: 'lockers',
      resource: `Casier ${locker.zone}-${locker.number}`,
      resourceId: locker.id,
      details: { notes },
    })
  } else if (action === 'end') {
    if (locker.status !== 'maintenance' && locker.status !== 'out_of_order') {
      return NextResponse.json(
        { error: { code: 'INVALID', message: 'Casier pas en maintenance' } },
        { status: 400 }
      )
    }

    await lRepo.endMaintenance(lockerId)

    await leRepo.create({
      locker: lockerId,
      eventType: 'maintenance_end',
      performedBy: session!.user.id,
      notes,
    } as any)

    await logAudit({
      ...getAuditUser(session!),
      action: 'locker_maintenance_end',
      module: 'lockers',
      resource: `Casier ${locker.zone}-${locker.number}`,
      resourceId: locker.id,
      details: { notes },
    })
  } else {
    return NextResponse.json(
      { error: { code: 'INVALID', message: 'Action invalide (start ou end)' } },
      { status: 400 }
    )
  }

  const updated = await lRepo.findById(lockerId)
  return NextResponse.json({ data: updated })
}
