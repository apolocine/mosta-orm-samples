// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { clientRepo, lockerRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'
import { logAudit, getAuditUser } from '@/lib/audit'

const updateClientSchema = z.object({
  clientType: z.enum(['abonne', 'visiteur']).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  photo: z.string().optional(),
  faceDescriptor: z.array(z.number()).length(128).optional(),
  address: z.string().optional(),
  wilaya: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  notes: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.CLIENT_VIEW)
  if (error) return error

  const { id } = await params
  const cRepo = await clientRepo()

  const client = await cRepo.findByIdWithRfid(id)
  if (!client) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Client non trouvé' } },
      { status: 404 }
    )
  }

  const lRepo = await lockerRepo()
  const locker = await lRepo.findOne(
    { currentClient: id, status: 'occupied' },
    { select: ['number', 'zone', 'rfidLockId', 'lastAssignedAt'] },
  )

  return NextResponse.json({ data: { ...client, locker: locker || null } })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkPermission(PERMISSIONS.CLIENT_UPDATE)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const parsed = updateClientSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const updateData: any = { ...parsed.data }
  if (updateData.email === '') delete updateData.email
  // Clean empty date fields: "" → null (PostgreSQL rejects "" for timestamp)
  if (updateData.dateOfBirth === '') {
    updateData.dateOfBirth = null
  } else if (updateData.dateOfBirth) {
    updateData.dateOfBirth = new Date(updateData.dateOfBirth)
  }

  const repo = await clientRepo()
  const client = await repo.update(id, updateData)

  if (!client) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Client non trouvé' } },
      { status: 404 }
    )
  }

  await logAudit({
    ...getAuditUser(session!),
    action: 'client_update',
    module: 'clients',
    resource: `${client.firstName} ${client.lastName}`,
    resourceId: id,
  })

  return NextResponse.json({ data: client })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkPermission(PERMISSIONS.CLIENT_DELETE)
  if (error) return error

  const { id } = await params
  const repo = await clientRepo()

  const client = await repo.update(id, { status: 'inactive' })

  if (!client) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Client non trouvé' } },
      { status: 404 }
    )
  }

  await logAudit({
    ...getAuditUser(session!),
    action: 'client_delete',
    module: 'clients',
    resource: `${client.firstName} ${client.lastName}`,
    resourceId: id,
  })

  return NextResponse.json({ data: client })
}
