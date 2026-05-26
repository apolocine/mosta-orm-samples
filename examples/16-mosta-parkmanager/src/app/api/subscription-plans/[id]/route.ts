// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { subscriptionPlanRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const repo = await subscriptionPlanRepo()
  const plan = await repo.update(id, body)

  if (!plan) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan non trouvé' } }, { status: 404 })
  }

  return NextResponse.json({ data: plan })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params
  const repo = await subscriptionPlanRepo()
  const deleted = await repo.delete(id)

  if (!deleted) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan non trouvé' } }, { status: 404 })
  }

  return NextResponse.json({ data: { message: 'Plan supprimé' } })
}
