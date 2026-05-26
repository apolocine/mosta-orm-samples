// Seed RBAC — peuple mp_roles / mp_permissions / mp_role_permissions /
// mp_user_roles selon le mapping ROLE_PERMISSIONS du sample.
//
// Sans ce seed, @mostajs/auth.resolveUserPermissions() retourne 0 permissions
// car (1) userWithRoles.roles est vide (table user_roles vide), (2) le legacy
// fallback sur user.role direct échoue car le UserSchema de @mostajs/rbac
// n'expose pas ce champ.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import { seedRBAC } from '@mostajs/rbac/lib/rbac-seed'
import { getRbacRepos } from '@mostajs/rbac/lib/repos-factory'
import { BaseRepository } from '@mostajs/orm'
import { openOrm, logSeedHeader } from '../_common/bootstrap'
import { UserSchema } from '../_common/schemas'
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from '../../src/lib/permissions'

interface UserRow { id: string; email: string; role: string }

async function main(): Promise<void> {
  logSeedHeader('rbac')
  await openOrm()

  // 1) Permissions, catégories, rôles via le helper @mostajs/rbac
  console.log('─── Création des rôles + permissions ───')
  // PermissionCategorySchema attend { name, label, description, ... } —
  // `label` est required.
  const categories = [
    { name: 'admin',     label: 'Administration',  description: 'Administration' },
    { name: 'client',    label: 'Clients',         description: 'Gestion clients' },
    { name: 'activity',  label: 'Activités',       description: 'Activités du parc' },
    { name: 'access',    label: 'Accès',           description: 'Accès / abonnements' },
    { name: 'ticket',    label: 'Tickets',         description: 'Tickets' },
    { name: 'scan',      label: 'Scan',            description: 'Scan QR / RFID' },
    { name: 'locker',    label: 'Casiers',         description: 'Casiers' },
    { name: 'rfid',      label: 'RFID',            description: 'Tags RFID' },
    { name: 'dashboard', label: 'Tableau de bord', description: 'Tableau de bord' },
    { name: 'audit',     label: 'Audit',           description: 'Journal d\'audit' },
  ]
  const permissions = Object.values(PERMISSIONS).map((code) => ({
    code,
    name: code,
    category: code.split(':')[0],
  }))
  const roles = {
    admin: {
      name: ROLES.ADMIN,
      description: 'Administrateur — toutes permissions',
      permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
    },
    accueil: {
      name: ROLES.AGENT_ACCUEIL,
      description: 'Agent accueil',
      permissions: ROLE_PERMISSIONS[ROLES.AGENT_ACCUEIL],
    },
    attraction: {
      name: ROLES.AGENT_ATTRACTION,
      description: 'Agent attraction',
      permissions: ROLE_PERMISSIONS[ROLES.AGENT_ATTRACTION],
    },
    superviseur: {
      name: ROLES.SUPERVISEUR,
      description: 'Superviseur',
      permissions: ROLE_PERMISSIONS[ROLES.SUPERVISEUR],
    },
  }
  const result = await seedRBAC({ categories, permissions, roles })
  console.log(`  ✓ ${result.categoryCount} catégories, ${result.permissionCount} permissions, ${result.roleCount} rôles`)

  // 2) Liaisons UserRole — chaque user du sample est lié à son rôle RBAC formel
  console.log('─── Liaison users → rôles (UserRole) ───')
  const repos = await getRbacRepos()
  const { roles: rolesRepo, users: rbacUsers } = repos
  const dialect = (rbacUsers as { dialect: unknown }).dialect as Parameters<typeof BaseRepository.prototype.constructor>[1]

  // BaseRepository sur UserSchema sample (qui inclut le champ role direct)
  const sampleUsers = new BaseRepository<UserRow>(UserSchema, dialect)
  const allUsers = await sampleUsers.findAll({})

  for (const u of allUsers) {
    const role = await rolesRepo.findOne({ name: u.role })
    if (!role) {
      console.log(`  ! Rôle "${u.role}" introuvable pour ${u.email}`)
      continue
    }
    // addRole = upsert dans la junction
    await rbacUsers.addRole(u.id, role.id as string)
    console.log(`  ✓ ${u.email.padEnd(28)} → ${u.role}`)
  }

  console.log('\n[Seed rbac] OK')
  process.exit(0)
}

main().catch((err) => {
  console.error('✗ Seed rbac failed:', err)
  process.exit(1)
})
