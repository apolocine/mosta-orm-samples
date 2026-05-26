// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { userRepo, roleRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { getPermissionsForRoleFromDB } from '@/lib/permissions-server'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.string().min(1).optional(),
  status: z.enum(['active', 'locked', 'disabled']).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params
  const repo = await userRepo()

  const user = await repo.findByIdSafe(id)
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Utilisateur non trouvé' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: user })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const parsed = updateUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const updateData: any = { ...parsed.data }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 12)
  }

  if (updateData.role) {
    // Validate role exists
    const KNOWN_ROLES = ['admin', 'agent_accueil', 'agent_attraction', 'superviseur']
    if (!KNOWN_ROLES.includes(updateData.role)) {
      const rRepo = await roleRepo()
      const dbRole = await rRepo.findByName(updateData.role)
      if (!dbRole) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `Le rôle "${updateData.role}" n'existe pas` } },
          { status: 400 }
        )
      }
    }
    updateData.permissions = await getPermissionsForRoleFromDB(updateData.role)
  }

  const repo = await userRepo()
  const user = await repo.update(id, updateData)

  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Utilisateur non trouvé' } },
      { status: 404 }
    )
  }

  const { password: _, ...userWithoutPassword } = user as any

  return NextResponse.json({ data: userWithoutPassword })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const { id } = await params

  if (session!.user.id === id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Impossible de supprimer votre propre compte' } },
      { status: 403 }
    )
  }

  const repo = await userRepo()
  const user = await repo.update(id, { status: 'disabled' })

  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Utilisateur non trouvé' } },
      { status: 404 }
    )
  }

  const { password: _, ...userWithoutPassword } = user as any

  return NextResponse.json({ data: userWithoutPassword })
}
