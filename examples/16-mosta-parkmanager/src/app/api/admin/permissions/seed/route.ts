// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server'
import { permissionRepo, roleRepo, permissionCategoryRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { PERMISSION_DEFINITIONS, DEFAULT_ROLES, CATEGORY_DEFINITIONS } from '@/lib/rbac-definitions'

export async function POST() {
  const { error } = await checkPermission(PERMISSIONS.ADMIN_ACCESS)
  if (error) return error

  const catRepo = await permissionCategoryRepo()
  const pRepo = await permissionRepo()
  const rRepo = await roleRepo()

  // Upsert categories
  for (const catDef of CATEGORY_DEFINITIONS) {
    await catRepo.upsert({ name: catDef.name }, catDef as any)
  }

  // Upsert all permissions
  const permissionMap: Record<string, string> = {}
  for (const pDef of PERMISSION_DEFINITIONS) {
    const perm = await pRepo.upsert(
      { name: pDef.name },
      { name: pDef.name, description: pDef.description, category: pDef.category },
    )
    permissionMap[pDef.code] = perm.id
  }

  // Upsert all default roles
  const rolesCreated: string[] = []
  for (const [, roleDef] of Object.entries(DEFAULT_ROLES)) {
    const permissionIds = roleDef.permissions
      .map((code) => permissionMap[code])
      .filter(Boolean)

    await rRepo.upsert(
      { name: roleDef.name },
      {
        name: roleDef.name,
        description: roleDef.description,
        permissions: permissionIds,
      },
    )
    rolesCreated.push(roleDef.name)
  }

  return NextResponse.json({
    data: {
      categories: CATEGORY_DEFINITIONS.length,
      permissions: PERMISSION_DEFINITIONS.length,
      roles: rolesCreated.length,
      message: `${CATEGORY_DEFINITIONS.length} catégories, ${PERMISSION_DEFINITIONS.length} permissions et ${rolesCreated.length} rôles initialisés`,
    },
  })
}
