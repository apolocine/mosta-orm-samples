// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { subscriptionPlanRepo, activityRepo } from '@/dal/service'
import { checkAuth, checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['temporal', 'usage', 'mixed']),
  duration: z.number().positive().nullable().optional(),
  activities: z.array(z.object({
    activity: z.string(),
    sessionsCount: z.number().positive().nullable().optional(),
  })),
  price: z.number().min(0),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const { error } = await checkAuth()
  if (error) return error

  const repo = await subscriptionPlanRepo()
  const plans = await repo.findAll({}, { sort: { createdAt: -1 } })

  // Populate activities[].activity (embedded array with ID refs — not a DAL relation)
  const aRepo = await activityRepo()
  const allActivities = await aRepo.findAll({}, { select: ['name', 'slug'] })
  const actMap = new Map(allActivities.map((a) => [a.id, a]))

  const populated = plans.map((plan: any) => ({
    ...plan,
    activities: (plan.activities || []).map((entry: any) => {
      const actId = typeof entry.activity === 'object' ? entry.activity?.id || entry.activity : entry.activity
      const act = actMap.get(actId)
      return {
        ...entry,
        activity: act ? { id: act.id, name: act.name, slug: act.slug } : { id: actId, name: actId },
      }
    }),
  }))

  return NextResponse.json({ data: populated })
}

export async function POST(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const body = await req.json()
  const parsed = planSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const repo = await subscriptionPlanRepo()
  const plan = await repo.create(parsed.data as any)
  return NextResponse.json({ data: plan }, { status: 201 })
}
