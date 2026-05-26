// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { permissionCategoryRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { CATEGORY_DEFINITIONS } from '@/lib/rbac-definitions'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Format requis : minuscules, chiffres et underscores'),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const repo = await permissionCategoryRepo()
  let categories = await repo.findAllOrdered()

  // Fallback: if DB is empty, return hardcoded definitions
  if (categories.length === 0) {
    const fallback = CATEGORY_DEFINITIONS.map((c, i) => ({
      id: `fallback_${i}`,
      name: c.name,
      label: c.label,
      description: c.description,
      icon: c.icon,
      order: c.order,
      system: c.system,
      _fallback: true,
    }))
    return NextResponse.json({ data: fallback })
  }

  return NextResponse.json({ data: categories })
}

export async function POST(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const body = await req.json()
  const parsed = createCategorySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Donnees invalides', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { name, label, description, icon, order } = parsed.data
  const repo = await permissionCategoryRepo()

  const existing = await repo.findByName(name)
  if (existing) {
    return NextResponse.json(
      { error: { code: 'DUPLICATE', message: 'Une categorie avec ce nom existe deja' } },
      { status: 409 }
    )
  }

  const category = await repo.create({
    name,
    label,
    description: description || '',
    icon: icon || '',
    order: order ?? 0,
    system: false,
  })

  return NextResponse.json({ data: category }, { status: 201 })
}
