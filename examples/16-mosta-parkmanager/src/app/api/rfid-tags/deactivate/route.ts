// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { rfidTagRepo, clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.RFID_DEACTIVATE)
  if (error) return error

  const { tagId } = await req.json()

  const tRepo = await rfidTagRepo()
  const tag = await tRepo.findByTagId(tagId)
  if (!tag) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'TAG non trouvé' } }, { status: 404 })
  }

  if (tag.client) {
    const cRepo = await clientRepo()
    await cRepo.update(typeof tag.client === 'object' ? tag.client.id : tag.client, { rfidTagId: null } as any)
  }

  const updated = await tRepo.deactivate(tag.id)

  await logAudit({
    ...getAuditUser(session!),
    action: 'tag_deactivate',
    module: 'rfid',
    resource: tagId,
    resourceId: tag.id,
  })

  return NextResponse.json({ data: updated })
}
