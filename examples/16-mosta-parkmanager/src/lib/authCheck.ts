// Author: Dr Hamid MADANI drmdh@msn.com
// Wrapper — delegates to @mostajs/auth module
import { createAuthChecks } from '@mostajs/auth/server'
import { auth } from '@/lib/auth'
import { ROLE_PERMISSIONS } from '@/lib/permissions'

const { checkAuth, checkPermission, getUserFromSession } = createAuthChecks(auth, ROLE_PERMISSIONS)

export { checkAuth, checkPermission, getUserFromSession }
