// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { rfidTagRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.RFID_VIEW)
  if (error) return error

  const repo = await rfidTagRepo()
  const tags = await repo.findAllWithRelations()

  return NextResponse.json({ data: tags })
}

export async function POST(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.RFID_PROGRAM)
  if (error) return error

  const { tagId, notes } = await req.json()

  if (!tagId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'tagId requis' } }, { status: 400 })
  }

  const repo = await rfidTagRepo()
  const existing = await repo.findByTagId(tagId)
  if (existing) {
    return NextResponse.json({ error: { code: 'DUPLICATE', message: 'Ce TAG existe déjà' } }, { status: 409 })
  }

  const tag = await repo.create({ tagId, notes, status: 'available' } as any)
  return NextResponse.json({ data: tag }, { status: 201 })
}
