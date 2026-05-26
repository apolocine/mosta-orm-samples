// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await checkPermission(PERMISSIONS.LOCKER_MANAGE)
  if (error) return error

  const { id } = await params
  const { rfidLockId } = await req.json()

  if (rfidLockId !== null && rfidLockId !== undefined && typeof rfidLockId !== 'string') {
    return NextResponse.json(
      { error: { code: 'INVALID', message: 'rfidLockId doit être une chaîne ou null' } },
      { status: 400 }
    )
  }

  const repo = await lockerRepo()
  const locker = await repo.findById(id)
  if (!locker) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Casier non trouvé' } },
      { status: 404 }
    )
  }

  // Check uniqueness: no other locker should have this rfidLockId
  if (rfidLockId) {
    const existing = await repo.findOne({ rfidLockId, id: { $ne: id } } as any)
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: `Ce TAG RFID est déjà attribué au casier N°${existing.number} (Zone ${existing.zone})` } },
        { status: 409 }
      )
    }
  }

  const updated = await repo.update(id, { rfidLockId: rfidLockId || null } as any)

  await logAudit({
    ...getAuditUser(session!),
    action: 'locker_rfid_lock_update',
    module: 'lockers',
    resource: `Casier ${locker.zone}-${locker.number}`,
    resourceId: locker.id,
  })

  return NextResponse.json({ data: updated })
}
