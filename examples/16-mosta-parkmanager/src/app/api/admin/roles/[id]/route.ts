// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { roleRepo, userRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS, ROLES } from '@/lib/permissions'
import { z } from 'zod'

const SYSTEM_ROLES = Object.values(ROLES)

const updateRoleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params
  const rRepo = await roleRepo()

  const role = await rRepo.findByIdWithPermissions(id)
  if (!role) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Rôle non trouvé' } },
      { status: 404 }
    )
  }

  const uRepo = await userRepo()
  const usersWithRoles = await uRepo.findWithRelations({}, ['roles'])
  const userCount = usersWithRoles.filter((u: any) =>
    (u.roles ?? []).some((r: any) => (typeof r === 'string' ? r : r.id) === id)
  ).length

  return NextResponse.json({ data: { ...role, userCount } })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const parsed = updateRoleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const rRepo = await roleRepo()
  const existingRole = await rRepo.findById(id)
  if (!existingRole) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Rôle non trouvé' } },
      { status: 404 }
    )
  }

  const { name, description, permissionIds } = parsed.data

  // Prevent renaming system roles
  if (name && name !== existingRole.name && SYSTEM_ROLES.includes(existingRole.name as any)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Impossible de renommer un rôle système' } },
      { status: 403 }
    )
  }

  // Check name uniqueness if changing
  if (name && name !== existingRole.name) {
    const duplicate = await rRepo.findByName(name)
    if (duplicate) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Un rôle avec ce nom existe déjà' } },
        { status: 409 }
      )
    }
  }

  const updateData: any = {}
  if (name) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (permissionIds) updateData.permissions = permissionIds

  await rRepo.update(id, updateData)
  const updated = await rRepo.findByIdWithPermissions(id)

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params
  const rRepo = await roleRepo()

  const role = await rRepo.findById(id)
  if (!role) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Rôle non trouvé' } },
      { status: 404 }
    )
  }

  // Prevent deleting system roles
  if (SYSTEM_ROLES.includes(role.name as any)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Impossible de supprimer un rôle système' } },
      { status: 403 }
    )
  }

  // Prevent deleting if users are assigned
  const uRepo = await userRepo()
  const usersWithRoles = await uRepo.findWithRelations({}, ['roles'])
  const userCount = usersWithRoles.filter((u: any) =>
    (u.roles ?? []).some((r: any) => (typeof r === 'string' ? r : r.id) === id)
  ).length
  if (userCount > 0) {
    return NextResponse.json(
      { error: { code: 'CONFLICT', message: `Impossible de supprimer : ${userCount} utilisateur(s) utilisent ce rôle` } },
      { status: 409 }
    )
  }

  await rRepo.delete(id)

  return NextResponse.json({ data: { message: 'Rôle supprimé' } })
}
