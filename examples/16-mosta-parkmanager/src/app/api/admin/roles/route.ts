// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { roleRepo, userRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { DEFAULT_ROLES } from '@/lib/rbac-definitions'
import { z } from 'zod'

const createRoleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Le nom doit être en minuscules (lettres, chiffres, underscores)'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
})

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const rRepo = await roleRepo()
  let roles = await rRepo.findAllWithPermissions()

  // Fallback: if DB is empty, return hardcoded defaults
  if (roles.length === 0) {
    const fallbackRoles = Object.values(DEFAULT_ROLES).map((r, i) => ({
      id: `fallback_${i}`,
      name: r.name,
      description: r.description,
      permissions: r.permissions.map((p) => ({ name: p })),
      userCount: 0,
      _fallback: true,
    }))
    return NextResponse.json({ data: fallbackRoles })
  }

  // Count users per role via ORM findWithRelations
  const uRepo = await userRepo()
  const usersWithRoles = await uRepo.findWithRelations({}, ['roles'])
  const countMap: Record<string, number> = {}
  for (const u of usersWithRoles) {
    const userRoles = (u as { roles?: { id: string }[] }).roles ?? []
    for (const role of userRoles) {
      const rid = typeof role === 'string' ? role : role.id
      countMap[rid] = (countMap[rid] || 0) + 1
    }
  }

  const rolesWithCount = roles.map((r) => ({
    ...r,
    userCount: countMap[r.id] || 0,
  }))

  return NextResponse.json({ data: rolesWithCount })
}

export async function POST(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const body = await req.json()
  const parsed = createRoleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { name, description, permissionIds } = parsed.data
  const rRepo = await roleRepo()

  const existing = await rRepo.findByName(name)
  if (existing) {
    return NextResponse.json(
      { error: { code: 'DUPLICATE', message: 'Un rôle avec ce nom existe déjà' } },
      { status: 409 }
    )
  }

  const role = await rRepo.create({
    name,
    description: description || '',
    permissions: permissionIds || [],
  })

  const populated = await rRepo.findByIdWithPermissions(role.id)

  return NextResponse.json({ data: populated }, { status: 201 })
}
