// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'
import { logAudit, getAuditUser } from '@/lib/audit'

const createClientSchema = z.object({
  clientType: z.enum(['abonne', 'visiteur']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  photo: z.string().optional(),
  faceDescriptor: z.array(z.number()).length(128).optional(),
  address: z.string().optional(),
  wilaya: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.CLIENT_VIEW)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const filter: any = {}
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $regexFlags: 'i' } },
      { lastName: { $regex: q, $regexFlags: 'i' } },
      { phone: { $regex: q, $regexFlags: 'i' } },
      { clientNumber: { $regex: q, $regexFlags: 'i' } },
      { email: { $regex: q, $regexFlags: 'i' } },
    ]
  }
  if (type) filter.clientType = type
  if (status) filter.status = status

  const repo = await clientRepo()
  const [clients, total] = await Promise.all([
    repo.findAll(filter, { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit }),
    repo.count(filter),
  ])

  return NextResponse.json({
    data: clients,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.CLIENT_CREATE)
  if (error) return error

  const body = await req.json()
  const parsed = createClientSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const clientData: any = { ...parsed.data, createdBy: session!.user.id }
  if (clientData.email === '') delete clientData.email
  if (clientData.dateOfBirth === '') {
    delete clientData.dateOfBirth
  } else if (clientData.dateOfBirth) {
    clientData.dateOfBirth = new Date(clientData.dateOfBirth)
  }

  const repo = await clientRepo()
  const client = await repo.create(clientData)

  await logAudit({
    ...getAuditUser(session!),
    action: 'client_create',
    module: 'clients',
    resource: `${client.firstName} ${client.lastName}`,
    resourceId: client.id,
    details: { clientType: client.clientType, clientNumber: client.clientNumber },
  })

  return NextResponse.json({ data: client }, { status: 201 })
}
