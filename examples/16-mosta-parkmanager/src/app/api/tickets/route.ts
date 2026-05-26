// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { ticketRepo, clientRepo, clientAccessRepo, activityRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'
import { logAudit, getAuditUser } from '@/lib/audit'

const createTicketSchema = z.object({
  clientId: z.string(),
  activityId: z.string(),
  ticketType: z.enum(['standard', 'cadeau']).default('standard'),
  sourceClientId: z.string().optional(),
  amount: z.number().min(0).default(0),
})

function computeValidUntil(mode: string, duration: number | null): Date | null {
  const now = new Date()
  switch (mode) {
    case 'day_reentry': {
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return end
    }
    case 'time_slot': {
      if (!duration) return null
      return new Date(now.getTime() + duration * 60000)
    }
    case 'single_use':
      return null // expires on use
    case 'unlimited':
      return null
    default:
      return null
  }
}

export async function GET(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.TICKET_VIEW)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')

  const filter: any = {}
  if (clientId) filter.client = clientId
  if (status) filter.status = status

  const tRepo = await ticketRepo()
  const tickets = await tRepo.findAll(filter, { sort: { createdAt: -1 }, limit })

  return NextResponse.json({ data: tickets })
}

export async function POST(req: NextRequest) {
  try {
  const { error, session } = await checkPermission(PERMISSIONS.TICKET_CREATE)
  if (error) return error

  const body = await req.json()
  console.log('[tickets/POST] body:', JSON.stringify(body))
  const parsed = createTicketSchema.safeParse(body)

  if (!parsed.success) {
    console.log('[tickets/POST] Zod error:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { clientId, activityId, ticketType, sourceClientId, amount } = parsed.data

  // For gift tickets, the access check is on the sourceClient
  const accessClientId = ticketType === 'cadeau' && sourceClientId ? sourceClientId : clientId

  const [cRepo, aRepo, caRepo, tRepo] = await Promise.all([
    clientRepo(),
    activityRepo(),
    clientAccessRepo(),
    ticketRepo(),
  ])

  const [client, activity, clientAccess] = await Promise.all([
    cRepo.findById(clientId),
    aRepo.findById(activityId),
    caRepo.findActiveAccess(accessClientId, activityId),
  ])

  if (!client) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Client non trouvé' } }, { status: 404 })
  }
  if (!activity) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } }, { status: 404 })
  }
  if (!clientAccess) {
    return NextResponse.json(
      { error: { code: 'NO_ACCESS', message: 'Ce client n\'a pas accès à cette activité' } },
      { status: 403 }
    )
  }

  // Check quota: count already generated tickets for this access
  if (clientAccess.totalQuota != null) {
    const ticketCount = await tRepo.countByAccess(clientAccess.id)
    if (ticketCount >= clientAccess.totalQuota) {
      return NextResponse.json(
        { error: { code: 'QUOTA_EXCEEDED', message: `Quota atteint : ${ticketCount}/${clientAccess.totalQuota} tickets déjà imprimés` } },
        { status: 403 }
      )
    }
  }

  // Les tickets cadeau n'expirent pas (utilisables un autre jour)
  const validUntil = ticketType === 'cadeau' ? null : computeValidUntil(activity.ticketValidityMode, activity.ticketDuration)

  const ticket = await tRepo.createWithAutoFields({
    client: clientId,
    clientAccess: clientAccess.id,
    activity: activityId,
    ticketType,
    sourceClient: ticketType === 'cadeau' ? sourceClientId : null,
    clientName: `${client.firstName} ${client.lastName}`,
    activityName: activity.name,
    validityMode: activity.ticketValidityMode,
    validUntil: validUntil?.toISOString() || null,
    amount,
    createdBy: session!.user.id,
  } as any)

  await logAudit({
    ...getAuditUser(session!),
    action: 'ticket_generate',
    module: 'tickets',
    resource: ticket.ticketNumber,
    resourceId: ticket.id,
    details: { ticketType, activityName: activity.name, clientName: `${client.firstName} ${client.lastName}` },
  })

  return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (err: unknown) {
    console.error('[tickets/POST] UNCAUGHT:', err)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Erreur interne' } },
      { status: 500 }
    )
  }
}
