// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { permissionRepo, roleRepo, permissionCategoryRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { PERMISSION_DEFINITIONS, CATEGORY_DEFINITIONS } from '@/lib/rbac-definitions'
import { z } from 'zod'

const createPermissionSchema = z.object({
  name: z.string().min(1).regex(/^[a-z_]+:[a-z_]+$/, 'Format requis : categorie:action'),
  description: z.string().optional(),
  category: z.string().optional(),
})

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  // Read category labels from DB, fallback to hardcoded
  const catRepo = await permissionCategoryRepo()
  const dbCategories = await catRepo.findAllOrdered()
  const categoryLabels: Record<string, string> = {}
  if (dbCategories.length > 0) {
    for (const cat of dbCategories) {
      categoryLabels[cat.name] = cat.label
    }
  } else {
    for (const cat of CATEGORY_DEFINITIONS) {
      categoryLabels[cat.name] = cat.label
    }
  }

  const pRepo = await permissionRepo()
  let permissions = await pRepo.findAllSorted()

  // Fallback: if DB is empty, return hardcoded definitions
  if (permissions.length === 0) {
    const fallback = PERMISSION_DEFINITIONS.map((p, i) => ({
      id: `fallback_${i}`,
      name: p.name,
      description: p.description,
      category: p.category,
      _fallback: true,
    }))
    return NextResponse.json({ data: fallback, categories: categoryLabels })
  }

  // Count roles per permission (must populate many-to-many for SQL dialects)
  const rRepo = await roleRepo()
  const roles = await rRepo.findAllWithPermissions()
  const permRoleCount: Record<string, number> = {}
  for (const role of roles) {
    for (const permId of role.permissions) {
      const key = typeof permId === 'object' ? (permId as any).id : String(permId)
      permRoleCount[key] = (permRoleCount[key] || 0) + 1
    }
  }

  const permissionsWithCount = permissions.map((p) => ({
    ...p,
    roleCount: permRoleCount[p.id] || 0,
  }))

  // Group by category
  const grouped: Record<string, typeof permissionsWithCount> = {}
  for (const p of permissionsWithCount) {
    const cat = p.category || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(p)
  }

  return NextResponse.json({ data: permissionsWithCount, grouped, categories: categoryLabels })
}

export async function POST(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const body = await req.json()
  const parsed = createPermissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { name, description, category } = parsed.data
  const pRepo = await permissionRepo()

  const existing = await pRepo.findByName(name)
  if (existing) {
    return NextResponse.json(
      { error: { code: 'DUPLICATE', message: 'Une permission avec ce nom existe déjà' } },
      { status: 409 }
    )
  }

  // Auto-derive category from name if not provided
  const derivedCategory = category || name.split(':')[0]

  // Validate category exists in DB or in fallback definitions
  const catRepo = await permissionCategoryRepo()
  const catExists = await catRepo.findByName(derivedCategory)
  if (!catExists) {
    const fallbackExists = CATEGORY_DEFINITIONS.some((c) => c.name === derivedCategory)
    if (!fallbackExists) {
      return NextResponse.json(
        { error: { code: 'INVALID_CATEGORY', message: `La categorie '${derivedCategory}' n'existe pas` } },
        { status: 400 }
      )
    }
  }

  const permission = await pRepo.create({
    name,
    description: description || '',
    category: derivedCategory,
  })

  return NextResponse.json({ data: permission }, { status: 201 })
}
