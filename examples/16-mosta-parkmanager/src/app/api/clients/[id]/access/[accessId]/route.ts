// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { clientAccessRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; accessId: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ACCESS_UPDATE)
  if (error) return error

  const { accessId } = await params

  const body = await req.json()
  const repo = await clientAccessRepo()
  const access = await repo.update(accessId, body)

  if (!access) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Accès non trouvé' } }, { status: 404 })
  }

  return NextResponse.json({ data: access })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; accessId: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ACCESS_REVOKE)
  if (error) return error

  const { accessId } = await params

  const repo = await clientAccessRepo()
  const access = await repo.block(accessId)

  if (!access) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Accès non trouvé' } }, { status: 404 })
  }

  return NextResponse.json({ data: access })
}
