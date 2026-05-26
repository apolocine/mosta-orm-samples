// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerRepo, lockerEventRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await checkPermission(PERMISSIONS.LOCKER_MANAGE)
  if (error) return error

  const { id } = await params
  const lRepo = await lockerRepo()

  const locker = await lRepo.findById(id)
  if (!locker) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouvé' } }, { status: 404 })
  }

  if (locker.status === 'occupied') {
    return NextResponse.json(
      { error: { code: 'INVALID', message: 'Impossible de supprimer un casier occupé' } },
      { status: 400 }
    )
  }

  const leRepo = await lockerEventRepo()
  await leRepo.deleteByLocker(id)
  await lRepo.delete(id)

  await logAudit({
    ...getAuditUser(session!),
    action: 'locker_delete',
    module: 'lockers',
    resource: `Casier ${locker.zone}-${locker.number}`,
    resourceId: locker.id,
  })

  return NextResponse.json({ data: { success: true } })
}
