// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { activityRepo } from '@/dal/service'
import { checkAuth, checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const updateActivitySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  capacity: z.number().positive().nullable().optional(),
  schedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string(),
    closeTime: z.string(),
    isOpen: z.boolean().default(true),
  })).optional(),
  ticketValidityMode: z.enum(['day_reentry', 'single_use', 'time_slot', 'unlimited']).optional(),
  ticketDuration: z.number().positive().nullable().optional(),
  price: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  sortOrder: z.number().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkAuth()
  if (error) return error

  const { id } = await params
  const repo = await activityRepo()

  const activity = await repo.findById(id)
  if (!activity) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: activity })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ACTIVITY_UPDATE)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const parsed = updateActivitySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const repo = await activityRepo()
  const activity = await repo.update(id, parsed.data as any)

  if (!activity) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: activity })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ACTIVITY_DELETE)
  if (error) return error

  const { id } = await params
  const repo = await activityRepo()

  const deleted = await repo.delete(id)
  if (!deleted) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { message: 'Activité supprimée' } })
}
