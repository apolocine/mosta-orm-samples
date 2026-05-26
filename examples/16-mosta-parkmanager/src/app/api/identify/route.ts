// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { clientRepo, ticketRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const identifySchema = z.object({
  qrCode: z.string().min(1),
})

/**
 * POST /api/identify
 * Identifie un QR code : est-ce un client ou un ticket ?
 */
export async function POST(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.CLIENT_SEARCH)
  if (error) return error

  const body = await req.json()
  const parsed = identifySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'QR code requis' } },
      { status: 400 }
    )
  }

  const { qrCode } = parsed.data

  const [cRepo, tRepo] = await Promise.all([clientRepo(), ticketRepo()])

  // Try to find as client first (by qrCode field)
  const client = await cRepo.findByQrCode(qrCode)

  if (client) {
    return NextResponse.json({ data: { type: 'client', client } })
  }

  // Try to find as ticket (by qrCode field)
  const ticket = await tRepo.findByQrCode(qrCode)

  if (ticket) {
    return NextResponse.json({ data: { type: 'ticket', ticket } })
  }

  return NextResponse.json({ data: { type: 'unknown' } })
}
