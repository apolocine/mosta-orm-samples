// Author: Dr Hamid MADANI <drmdh@msn.com>
// Wrapper — delegates to @mostajs/auth module + validation session.user.id
// All auth logic (NextAuth config, authorize, JWT callbacks) is in the module
import { createAuthHandlers } from '@mostajs/auth/server'
import { ROLE_PERMISSIONS } from '@/lib/permissions'
import { userRepo } from '@/dal/service'

const {
  handlers,
  auth: rawAuth,
  signIn,
  signOut,
} = createAuthHandlers(ROLE_PERMISSIONS, {
  pages: { signIn: '/login', error: '/login' },
})

/**
 * Validation de session : si `session.user.id` ne correspond plus à un user
 * en DB (cas typique : reseed de la DB sans clear des cookies, ou user
 * supprimé), retourner `null` pour forcer le re-login.
 *
 * Sans cette validation, le JWT contient un id stale et toute opération
 * qui utilise `session.user.id` comme FK (LockerEvent.performedBy,
 * ScanLog.scannedBy, AuditLog.userId, etc.) crashe avec une erreur
 * `FOREIGN KEY constraint failed` opaque.
 *
 * Coût : 1 SELECT par appel `auth()`. Cache automatique côté Next.js
 * Server Components (même request = même appel).
 *
 * Fail-open : si la vérification DB échoue (ORM pas connecté, etc.),
 * on laisse passer pour ne pas bloquer le boot.
 */
const auth = (async (...args: Parameters<typeof rawAuth>) => {
  const session = await rawAuth(...args)
  if (session?.user?.id) {
    try {
      const users = await userRepo()
      const exists = await users.findById(session.user.id)
      if (!exists) {
        return null
      }
    } catch {
      // ORM indisponible — fail-open pour ne pas bloquer (cold start, etc.)
    }
  }
  return session
}) as typeof rawAuth

export { handlers, auth, signIn, signOut }

export const getServerSession = auth

export { PERMISSIONS, ROLES, hasPermission } from '@/lib/permissions'
