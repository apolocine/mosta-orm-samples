// Author: Dr Hamid MADANI drmdh@msn.com
// Definitions francaises des permissions et roles par defaut pour le RBAC

import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from './permissions'

export interface PermissionDefinition {
  code: string
  name: string
  description: string
  category: string
}

export interface RoleDefinition {
  name: string
  description: string
  system: boolean
  permissions: string[]
}

export interface CategoryDefinition {
  name: string
  label: string
  description: string
  icon: string
  order: number
  system: boolean
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { name: 'admin', label: 'Administration', description: 'Gestion du panneau d\'administration et des paramètres', icon: 'Settings', order: 0, system: true },
  { name: 'client', label: 'Clients', description: 'Gestion des clients et de leurs informations', icon: 'Users', order: 1, system: true },
  { name: 'activity', label: 'Activités', description: 'Gestion des activités et attractions', icon: 'Activity', order: 2, system: true },
  { name: 'access', label: 'Accès & Abonnements', description: 'Gestion des accès et abonnements clients', icon: 'KeyRound', order: 3, system: true },
  { name: 'ticket', label: 'Tickets', description: 'Création et gestion des tickets d\'entrée', icon: 'Ticket', order: 4, system: true },
  { name: 'scan', label: 'Scan & Validation', description: 'Validation des entrées par scan', icon: 'ScanLine', order: 5, system: true },
  { name: 'locker', label: 'Casiers', description: 'Gestion des casiers et vestiaires', icon: 'Lock', order: 6, system: true },
  { name: 'rfid', label: 'Cartes RFID', description: 'Programmation et gestion des cartes RFID', icon: 'CreditCard', order: 7, system: true },
  { name: 'dashboard', label: 'Tableau de bord', description: 'Accès au tableau de bord et statistiques', icon: 'LayoutDashboard', order: 8, system: true },
  { name: 'audit', label: 'Audit', description: 'Consultation des journaux d\'audit', icon: 'FileText', order: 9, system: true },
]

export const PERMISSION_CATEGORIES: Record<string, string> = {
  admin: 'Administration',
  client: 'Clients',
  activity: 'Activités',
  access: 'Accès & Abonnements',
  ticket: 'Tickets',
  scan: 'Scan & Validation',
  locker: 'Casiers',
  rfid: 'Cartes RFID',
  dashboard: 'Tableau de bord',
  audit: 'Audit',
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Admin
  { code: PERMISSIONS.ADMIN_ACCESS, name: 'admin:access', description: 'Accéder au panneau d\'administration', category: 'admin' },
  { code: PERMISSIONS.ADMIN_SETTINGS, name: 'admin:settings', description: 'Gérer les paramètres système', category: 'admin' },
  // Clients
  { code: PERMISSIONS.CLIENT_VIEW, name: 'client:view', description: 'Voir la liste des clients', category: 'client' },
  { code: PERMISSIONS.CLIENT_CREATE, name: 'client:create', description: 'Créer un nouveau client', category: 'client' },
  { code: PERMISSIONS.CLIENT_UPDATE, name: 'client:update', description: 'Modifier un client existant', category: 'client' },
  { code: PERMISSIONS.CLIENT_DELETE, name: 'client:delete', description: 'Supprimer un client', category: 'client' },
  { code: PERMISSIONS.CLIENT_SEARCH, name: 'client:search', description: 'Rechercher des clients', category: 'client' },
  // Activities
  { code: PERMISSIONS.ACTIVITY_VIEW, name: 'activity:view', description: 'Voir les activités', category: 'activity' },
  { code: PERMISSIONS.ACTIVITY_CREATE, name: 'activity:create', description: 'Créer une activité', category: 'activity' },
  { code: PERMISSIONS.ACTIVITY_UPDATE, name: 'activity:update', description: 'Modifier une activité', category: 'activity' },
  { code: PERMISSIONS.ACTIVITY_DELETE, name: 'activity:delete', description: 'Supprimer une activité', category: 'activity' },
  // Access
  { code: PERMISSIONS.ACCESS_VIEW, name: 'access:view', description: 'Voir les abonnements et quotas', category: 'access' },
  { code: PERMISSIONS.ACCESS_CREATE, name: 'access:create', description: 'Créer un abonnement', category: 'access' },
  { code: PERMISSIONS.ACCESS_UPDATE, name: 'access:update', description: 'Modifier un abonnement', category: 'access' },
  { code: PERMISSIONS.ACCESS_REVOKE, name: 'access:revoke', description: 'Révoquer un accès', category: 'access' },
  // Tickets
  { code: PERMISSIONS.TICKET_CREATE, name: 'ticket:create', description: 'Créer un ticket d\'entrée', category: 'ticket' },
  { code: PERMISSIONS.TICKET_VIEW, name: 'ticket:view', description: 'Voir les tickets', category: 'ticket' },
  // Scan
  { code: PERMISSIONS.SCAN_VALIDATE, name: 'scan:validate', description: 'Valider un scan d\'entrée', category: 'scan' },
  { code: PERMISSIONS.SCAN_VIEW_HISTORY, name: 'scan:view_history', description: 'Voir l\'historique des scans', category: 'scan' },
  // Lockers
  { code: PERMISSIONS.LOCKER_VIEW, name: 'locker:view', description: 'Voir les casiers', category: 'locker' },
  { code: PERMISSIONS.LOCKER_ASSIGN, name: 'locker:assign', description: 'Assigner un casier', category: 'locker' },
  { code: PERMISSIONS.LOCKER_RELEASE, name: 'locker:release', description: 'Libérer un casier', category: 'locker' },
  { code: PERMISSIONS.LOCKER_MANAGE, name: 'locker:manage', description: 'Gérer tous les casiers', category: 'locker' },
  // RFID
  { code: PERMISSIONS.RFID_VIEW, name: 'rfid:view', description: 'Voir les cartes RFID', category: 'rfid' },
  { code: PERMISSIONS.RFID_PROGRAM, name: 'rfid:program', description: 'Programmer une carte RFID', category: 'rfid' },
  { code: PERMISSIONS.RFID_DEACTIVATE, name: 'rfid:deactivate', description: 'Désactiver une carte RFID', category: 'rfid' },
  { code: PERMISSIONS.RFID_REPLACE, name: 'rfid:replace', description: 'Remplacer une carte RFID', category: 'rfid' },
  // Dashboard
  { code: PERMISSIONS.DASHBOARD_VIEW, name: 'dashboard:view', description: 'Voir le tableau de bord', category: 'dashboard' },
  // Audit
  { code: PERMISSIONS.AUDIT_VIEW, name: 'audit:view', description: 'Voir les journaux d\'audit', category: 'audit' },
]

export const DEFAULT_ROLES: Record<string, RoleDefinition> = {
  [ROLES.ADMIN]: {
    name: ROLES.ADMIN,
    description: 'Administrateur avec accès complet à toutes les fonctionnalités',
    system: true,
    permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
  },
  [ROLES.AGENT_ACCUEIL]: {
    name: ROLES.AGENT_ACCUEIL,
    description: 'Agent d\'accueil : gestion clients, tickets, casiers et cartes RFID',
    system: true,
    permissions: ROLE_PERMISSIONS[ROLES.AGENT_ACCUEIL],
  },
  [ROLES.AGENT_ATTRACTION]: {
    name: ROLES.AGENT_ATTRACTION,
    description: 'Agent d\'attraction : consultation activités et validation des entrées',
    system: true,
    permissions: ROLE_PERMISSIONS[ROLES.AGENT_ATTRACTION],
  },
  [ROLES.SUPERVISEUR]: {
    name: ROLES.SUPERVISEUR,
    description: 'Superviseur : consultation, statistiques et audit',
    system: true,
    permissions: ROLE_PERMISSIONS[ROLES.SUPERVISEUR],
  },
}
