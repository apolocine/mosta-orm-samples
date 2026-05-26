// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { ticketRepo, clientAccessRepo, scanLogRepo, clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { logAudit, getAuditUser } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.SCAN_VALIDATE)
  if (error) return error

  const { qrCode, scanMethod = 'webcam' } = await req.json()

  if (!qrCode) {
    return NextResponse.json({ error: { code: 'INVALID', message: 'QR code manquant' } }, { status: 400 })
  }

  const slRepo = await scanLogRepo()

  // Find ticket by qrCode field (UUID or legacy ObjectId)
  const tRepo = await ticketRepo()
  const ticket = await tRepo.findByQrCode(qrCode)
  if (!ticket) {
    await slRepo.create({
      scannedBy: session!.user.id,
      scanMethod,
      result: 'denied',
      denyReason: 'invalid_ticket',
      timestamp: new Date(),
    } as any)
    return NextResponse.json({
      data: { result: 'denied', reason: 'invalid_ticket' },
    })
  }

  // 2. Check ticket status
  // day_reentry tickets can be re-scanned even when 'used' (same-day re-entry)
  if (ticket.status === 'used' && ticket.validityMode !== 'day_reentry') {
    await createDeniedLog(slRepo, ticket, session!.user.id, scanMethod, 'ticket_already_used')
    return NextResponse.json({
      data: { result: 'denied', reason: 'ticket_already_used', ticket: ticketInfo(ticket) },
    })
  }

  if (ticket.status === 'expired' || ticket.status === 'cancelled') {
    await createDeniedLog(slRepo, ticket, session!.user.id, scanMethod, `ticket_${ticket.status}`)
    return NextResponse.json({
      data: { result: 'denied', reason: `ticket_${ticket.status}`, ticket: ticketInfo(ticket) },
    })
  }

  // 3. Check validUntil
  if (ticket.validUntil && new Date() > new Date(ticket.validUntil)) {
    await tRepo.update(ticket.id, { status: 'expired' })
    await createDeniedLog(slRepo, ticket, session!.user.id, scanMethod, 'ticket_expired')
    return NextResponse.json({
      data: { result: 'denied', reason: 'ticket_expired', ticket: ticketInfo(ticket) },
    })
  }

  // 4. Find ClientAccess
  const caRepo = await clientAccessRepo()
  const accessId = typeof ticket.clientAccess === 'object' ? (ticket.clientAccess as any).id : ticket.clientAccess
  const clientAccess = await caRepo.findById(accessId)
  if (!clientAccess || clientAccess.status !== 'active') {
    const reason = clientAccess?.status === 'depleted' ? 'quota_depleted' : 'access_expired'
    await createDeniedLog(slRepo, ticket, session!.user.id, scanMethod, reason)
    return NextResponse.json({
      data: { result: 'denied', reason, ticket: ticketInfo(ticket) },
    })
  }

  // 5. Check client status
  const cRepo = await clientRepo()
  const clientId = typeof ticket.client === 'object' ? (ticket.client as any).id : ticket.client
  const client = await cRepo.findById(clientId)
  if (!client || client.status !== 'active') {
    await createDeniedLog(slRepo, ticket, session!.user.id, scanMethod, 'client_suspended')
    return NextResponse.json({
      data: { result: 'denied', reason: 'client_suspended', ticket: ticketInfo(ticket) },
    })
  }

  // 6. Process according to validityMode
  const quotaBefore = clientAccess.remainingQuota
  let quotaAfter = quotaBefore
  let isReentry = false

  const ticketUpdates: any = {}
  const accessUpdates: any = {}

  switch (ticket.validityMode) {
    case 'single_use':
    case 'time_slot':
    case 'unlimited': {
      ticketUpdates.status = 'used'
      ticketUpdates.scannedAt = new Date()
      ticketUpdates.scannedBy = session!.user.id
      if (clientAccess.remainingQuota != null) {
        const newQuota = Math.max(0, clientAccess.remainingQuota - 1)
        accessUpdates.remainingQuota = newQuota
        quotaAfter = newQuota
        if (newQuota === 0) {
          accessUpdates.status = 'depleted'
        }
      }
      break
    }
    case 'day_reentry': {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const alreadyScannedThisTicket = await slRepo.findOne({
        ticket: ticket.id,
        result: 'granted',
        timestamp: { $gte: todayStart },
      } as any)

      if (alreadyScannedThisTicket) {
        isReentry = true
      } else {
        ticketUpdates.status = 'used'
        if (clientAccess.remainingQuota != null) {
          const newQuota = Math.max(0, clientAccess.remainingQuota - 1)
          accessUpdates.remainingQuota = newQuota
          quotaAfter = newQuota
          if (newQuota === 0) {
            accessUpdates.status = 'depleted'
          }
        }
      }
      ticketUpdates.scannedAt = new Date()
      ticketUpdates.scannedBy = session!.user.id
      break
    }
  }

  await Promise.all([
    tRepo.update(ticket.id, ticketUpdates),
    Object.keys(accessUpdates).length > 0 ? caRepo.update(clientAccess.id, accessUpdates) : Promise.resolve(),
  ])

  // Create granted scan log
  await slRepo.create({
    ticket: ticket.id,
    client: clientId,
    activity: typeof ticket.activity === 'object' ? (ticket.activity as any).id : ticket.activity,
    scannedBy: session!.user.id,
    scanMethod,
    result: 'granted',
    quotaBefore,
    quotaAfter,
    isReentry,
    timestamp: new Date(),
  } as any)

  await logAudit({
    ...getAuditUser(session!),
    action: isReentry ? 'scan_reentry' : 'scan_granted',
    module: 'scan',
    resource: ticket.ticketNumber,
    resourceId: ticket.id,
    details: { clientName: `${client.firstName} ${client.lastName}`, activityName: ticket.activityName, quotaAfter, isReentry },
  })

  return NextResponse.json({
    data: {
      result: 'granted',
      isReentry,
      ticket: ticketInfo(ticket),
      client: {
        name: `${client.firstName} ${client.lastName}`,
        clientNumber: client.clientNumber,
        photo: client.photo,
        faceDescriptor: (client as any).faceDescriptor,
      },
      access: {
        remainingQuota: quotaAfter,
        totalQuota: clientAccess.totalQuota,
        endDate: clientAccess.endDate,
        status: Object.keys(accessUpdates).length > 0 ? accessUpdates.status || clientAccess.status : clientAccess.status,
      },
    },
  })
}

function ticketInfo(ticket: any) {
  return {
    ticketNumber: ticket.ticketNumber,
    clientName: ticket.clientName,
    activityName: ticket.activityName,
    ticketType: ticket.ticketType,
    validityMode: ticket.validityMode,
    status: ticket.status,
  }
}

async function createDeniedLog(
  slRepo: any,
  ticket: any,
  userId: string,
  scanMethod: string,
  reason: string
) {
  await slRepo.create({
    ticket: ticket.id,
    client: typeof ticket.client === 'object' ? (ticket.client as any).id : ticket.client,
    activity: typeof ticket.activity === 'object' ? (ticket.activity as any).id : ticket.activity,
    scannedBy: userId,
    scanMethod,
    result: 'denied',
    denyReason: reason,
    timestamp: new Date(),
  })
}
