// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { userRepo, roleRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { getPermissionsForRoleFromDB } from '@/lib/permissions-server'
import { z } from 'zod'
import { logAudit, getAuditUser } from '@/lib/audit'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.string().min(1),
})

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const repo = await userRepo()
  const users = await repo.findAllSafe({}, { sort: { createdAt: -1 } })

  return NextResponse.json({ data: users })
}

export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const body = await req.json()
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { email, password, firstName, lastName, phone, role } = parsed.data
  const repo = await userRepo()

  const existing = await repo.findByEmail(email)
  if (existing) {
    return NextResponse.json(
      { error: { code: 'DUPLICATE', message: 'Cet email est déjà utilisé' } },
      { status: 409 }
    )
  }

  // Validate role exists (DB or constants)
  const KNOWN_ROLES = ['admin', 'agent_accueil', 'agent_attraction', 'superviseur']
  if (!KNOWN_ROLES.includes(role)) {
    const rRepo = await roleRepo()
    const dbRole = await rRepo.findByName(role)
    if (!dbRole) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: `Le rôle "${role}" n'existe pas` } },
        { status: 400 }
      )
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const permissions = await getPermissionsForRoleFromDB(role)

  const user = await repo.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName,
    phone,
    role,
    permissions,
    status: 'active',
  } as any)

  const { password: _, ...userWithoutPassword } = user as any

  await logAudit({
    ...getAuditUser(session!),
    action: 'user_create',
    module: 'users',
    resource: `${firstName} ${lastName}`,
    resourceId: user.id,
    details: { email, role },
  })

  return NextResponse.json({ data: userWithoutPassword }, { status: 201 })
}
