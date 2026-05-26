// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { permissionRepo, roleRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const updatePermissionSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const parsed = updatePermissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const pRepo = await permissionRepo()
  const permission = await pRepo.update(id, parsed.data)

  if (!permission) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Permission non trouvée' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: permission })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params
  const pRepo = await permissionRepo()

  const permission = await pRepo.findById(id)
  if (!permission) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Permission non trouvée' } },
      { status: 404 }
    )
  }

  // Remove permission from all roles that have it
  const rRepo = await roleRepo()
  await rRepo.removePermissionFromAll(id)

  await pRepo.delete(id)

  return NextResponse.json({ data: { message: 'Permission supprimée' } })
}
