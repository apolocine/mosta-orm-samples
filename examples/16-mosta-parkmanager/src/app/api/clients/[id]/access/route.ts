// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { clientAccessRepo, subscriptionPlanRepo, activityRepo, ticketRepo, scanLogRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const assignAccessSchema = z.object({
  planId: z.string().optional(),
  activityId: z.string().optional(),
  accessType: z.enum(['unlimited', 'count', 'temporal', 'mixed']).optional(),
  totalQuota: z.number().positive().nullable().optional(),
  durationDays: z.number().positive().nullable().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ACCESS_VIEW)
  if (error) return error

  const { id } = await params

  const caRepo = await clientAccessRepo()
  const accesses = await caRepo.findByClient(id)

  // Count tickets generated per clientAccess
  const accessIds = accesses.map((a) => a.id)
  const tRepo = await ticketRepo()
  const ticketCounts = await tRepo.countsByAccess(accessIds)
  const ticketCountMap: Record<string, number> = {}
  for (const tc of ticketCounts) {
    ticketCountMap[tc.clientAccess] = tc.count
  }

  // Count granted scans per clientAccess (via tickets)
  const scanCountMap: Record<string, number> = {}
  if (accessIds.length > 0) {
    const allTickets = await tRepo.findAll({ clientAccess: { $in: accessIds } }, { select: ['clientAccess'] })
    const ticketIds = allTickets.map((t) => t.id)
    const ticketToAccess: Record<string, string> = {}
    for (const tk of allTickets) {
      ticketToAccess[tk.id] = typeof tk.clientAccess === 'object' ? (tk.clientAccess as any).id : tk.clientAccess
    }

    if (ticketIds.length > 0) {
      const slRepo = await scanLogRepo()
      const scanCounts = await slRepo.aggregate<{ ticket: string; count: number }>([
        { $match: { ticket: { $in: ticketIds }, result: 'granted', isReentry: { $ne: true } } },
        { $group: { _by: 'ticket', count: { $sum: 1 } } },
      ])
      for (const sc of scanCounts) {
        const accessId = ticketToAccess[sc.ticket]
        if (accessId) {
          scanCountMap[accessId] = (scanCountMap[accessId] || 0) + sc.count
        }
      }
    }
  }

  const accessesWithTickets = accesses.map((a) => ({
    ...a,
    ticketCount: ticketCountMap[a.id] || 0,
    scanCount: scanCountMap[a.id] || 0,
  }))

  // Get all activities to show which ones have no access
  const aRepo = await activityRepo()
  const activities = await aRepo.findActive()

  return NextResponse.json({ data: { accesses: accessesWithTickets, activities } })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkPermission(PERMISSIONS.ACCESS_CREATE)
  if (error) return error

  const { id: clientId } = await params

  const body = await req.json()
  const parsed = assignAccessSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { planId, activityId, accessType, totalQuota, durationDays } = parsed.data
  const caRepo = await clientAccessRepo()

  // Assign via plan
  if (planId) {
    const spRepo = await subscriptionPlanRepo()
    const plan = await spRepo.findById(planId)
    if (!plan) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan non trouvé' } }, { status: 404 })
    }

    const createdAccesses = []
    for (const planActivity of plan.activities) {
      const actId = typeof planActivity.activity === 'object' ? (planActivity.activity as any).id : planActivity.activity
      if (!actId) continue // skip si activity non résolu

      // Check if active access already exists
      const existing = await caRepo.findActiveAccess(clientId, actId)
      if (existing) continue

      // Réactiver un accès bloqué existant
      const blocked = await caRepo.findBlockedAccess(clientId, actId)

      let at: string = 'unlimited'
      let tq: number | null = null
      let endDate: Date | null = null

      if (plan.type === 'temporal') {
        at = 'temporal'
        endDate = plan.duration ? new Date(Date.now() + plan.duration * 86400000) : null
      } else if (plan.type === 'usage') {
        at = 'count'
        tq = planActivity.sessionsCount
      } else if (plan.type === 'mixed') {
        at = 'mixed'
        tq = planActivity.sessionsCount
        endDate = plan.duration ? new Date(Date.now() + plan.duration * 86400000) : null
      }

      if (blocked) {
        const reactivated = await caRepo.update(blocked.id, {
          plan: planId,
          accessType: at,
          totalQuota: tq,
          remainingQuota: tq,
          startDate: new Date(),
          endDate,
          status: 'active',
        })
        createdAccesses.push(reactivated)
      } else {
        const access = await caRepo.create({
          client: clientId,
          plan: planId,
          activity: actId,
          accessType: at,
          totalQuota: tq,
          remainingQuota: tq,
          startDate: new Date(),
          endDate,
          status: 'active',
          createdBy: session!.user.id,
        })
        createdAccesses.push(access)
      }
    }

    return NextResponse.json({ data: createdAccesses }, { status: 201 })
  }

  // Manual assignment (single activity)
  if (activityId && accessType) {
    const existing = await caRepo.findActiveAccess(clientId, activityId)
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Accès déjà attribué pour cette activité' } },
        { status: 409 }
      )
    }

    const endDate = durationDays ? new Date(Date.now() + durationDays * 86400000) : null

    // Réactiver un accès bloqué existant avec les nouvelles valeurs
    const blocked = await caRepo.findBlockedAccess(clientId, activityId)
    if (blocked) {
      const reactivated = await caRepo.update(blocked.id, {
        accessType,
        totalQuota: totalQuota || null,
        remainingQuota: totalQuota || null,
        startDate: new Date(),
        endDate,
        status: 'active',
      })

      return NextResponse.json({ data: reactivated }, { status: 200 })
    }

    const access = await caRepo.create({
      client: clientId,
      plan: null,
      activity: activityId,
      accessType,
      totalQuota: totalQuota || null,
      remainingQuota: totalQuota || null,
      startDate: new Date(),
      endDate,
      status: 'active',
      createdBy: session!.user.id,
    })

    return NextResponse.json({ data: access }, { status: 201 })
  }

  return NextResponse.json(
    { error: { code: 'VALIDATION_ERROR', message: 'Spécifiez un planId ou activityId + accessType' } },
    { status: 400 }
  )
}
