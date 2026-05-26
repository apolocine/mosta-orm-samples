// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { rfidTagRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.RFID_PROGRAM)
  if (error) return error

  const { tagId } = await req.json()

  const repo = await rfidTagRepo()
  const tag = await repo.findByTagId(tagId)
  if (!tag) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'TAG non trouvé' } }, { status: 404 })
  }

  if (tag.status !== 'deactivated') {
    return NextResponse.json(
      { error: { code: 'INVALID', message: 'Seul un TAG désactivé peut être réactivé' } },
      { status: 400 }
    )
  }

  const updated = await repo.reactivate(tag.id)

  await logAudit({
    ...getAuditUser(session!),
    action: 'tag_reactivate',
    module: 'rfid',
    resource: tagId,
    resourceId: tag.id,
  })

  return NextResponse.json({ data: updated })
}
