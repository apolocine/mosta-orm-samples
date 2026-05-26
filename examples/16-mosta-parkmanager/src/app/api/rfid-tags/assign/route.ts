// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { rfidTagRepo, clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.RFID_PROGRAM)
  if (error) return error

  const { tagId, clientId } = await req.json()

  const tRepo = await rfidTagRepo()
  const tag = await tRepo.findByTagId(tagId)
  if (!tag) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'TAG non trouvé' } }, { status: 404 })
  }
  if (tag.status !== 'available') {
    return NextResponse.json({ error: { code: 'INVALID', message: 'TAG non disponible' } }, { status: 400 })
  }

  const cRepo = await clientRepo()
  const client = await cRepo.findById(clientId)
  if (!client) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Client non trouvé' } }, { status: 404 })
  }

  // Check client doesn't already have an active tag
  const existingTag = await tRepo.findByClient(clientId)
  if (existingTag) {
    return NextResponse.json({ error: { code: 'DUPLICATE', message: 'Ce client a déjà un TAG actif' } }, { status: 409 })
  }

  const updatedTag = await tRepo.assign(tag.id, clientId, session!.user.id)
  await cRepo.update(clientId, { rfidTagId: tag.id } as any)

  await logAudit({
    ...getAuditUser(session!),
    action: 'tag_assign',
    module: 'rfid',
    resource: tagId,
    resourceId: tag.id,
    details: { clientId, clientName: `${client.firstName} ${client.lastName}` },
  })

  return NextResponse.json({ data: updatedTag })
}
