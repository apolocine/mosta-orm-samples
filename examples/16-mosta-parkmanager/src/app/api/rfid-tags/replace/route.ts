// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { rfidTagRepo, clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.RFID_REPLACE)
  if (error) return error

  const { oldTagId, newTagId } = await req.json()

  const tRepo = await rfidTagRepo()

  const oldTag = await tRepo.findByTagId(oldTagId)
  if (!oldTag) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Ancien TAG non trouvé' } }, { status: 404 })
  }

  const newTag = await tRepo.findByTagId(newTagId)
  if (!newTag) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Nouveau TAG non trouvé' } }, { status: 404 })
  }
  if (newTag.status !== 'available') {
    return NextResponse.json({ error: { code: 'INVALID', message: 'Nouveau TAG non disponible' } }, { status: 400 })
  }

  const clientId = typeof oldTag.client === 'object' ? (oldTag.client as any)?.id : oldTag.client

  // Deactivate old tag
  const updatedOld = await tRepo.markLost(oldTag.id)

  // Assign new tag
  const updatedNew = await tRepo.assign(newTag.id, clientId, session!.user.id)

  if (clientId) {
    const cRepo = await clientRepo()
    await cRepo.update(clientId, { rfidTagId: newTag.id } as any)
  }

  return NextResponse.json({ data: { oldTag: updatedOld, newTag: updatedNew } })
}
