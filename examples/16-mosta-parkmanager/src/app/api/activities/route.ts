// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { activityRepo } from '@/dal/service'
import { checkAuth, checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string(),
  closeTime: z.string(),
  isOpen: z.boolean().default(true),
})

const createActivitySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  capacity: z.number().positive().optional(),
  schedule: z.array(scheduleSchema).optional(),
  ticketValidityMode: z.enum(['day_reentry', 'single_use', 'time_slot', 'unlimited']),
  ticketDuration: z.number().positive().nullable().optional(),
  price: z.number().min(0),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  sortOrder: z.number().optional(),
})

export async function GET() {
  const { error } = await checkAuth()
  if (error) return error

  const repo = await activityRepo()
  const activities = await repo.findAllOrdered()

  return NextResponse.json({ data: activities })
}

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.ACTIVITY_CREATE)
  if (error) return error

  const body = await req.json()
  const parsed = createActivitySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const repo = await activityRepo()

  const existing = await repo.findBySlug(parsed.data.slug)
  if (existing) {
    return NextResponse.json(
      { error: { code: 'DUPLICATE', message: 'Ce slug est déjà utilisé' } },
      { status: 409 }
    )
  }

  const activity = await repo.create({
    ...parsed.data,
    createdBy: session!.user.id,
  })

  return NextResponse.json({ data: activity }, { status: 201 })
}
