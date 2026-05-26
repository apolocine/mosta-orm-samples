// Author: Dr Hamid MADANI drmdh@msn.com
import common from './fr/common.json'
import auth from './fr/auth.json'
import clients from './fr/clients.json'
import activities from './fr/activities.json'
import tickets from './fr/tickets.json'
import scan from './fr/scan.json'
import access from './fr/access.json'
import lockers from './fr/lockers.json'
import rfid from './fr/rfid.json'
import dashboard from './fr/dashboard.json'
import audit from './fr/audit.json'
import users from './fr/users.json'
import reception from './fr/reception.json'
import settings from './fr/settings.json'
import pwa from './fr/pwa.json'
import about from './fr/about.json'
import guide from './fr/guide.json'
import roles from './fr/roles.json'

const translations = {
  common,
  auth,
  clients,
  activities,
  tickets,
  scan,
  access,
  lockers,
  rfid,
  dashboard,
  audit,
  users,
  reception,
  settings,
  pwa,
  about,
  guide,
  roles,
} as const

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : Key
}[keyof ObjectType & string]

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}

export function t(key: string, params?: Record<string, string | number>): string {
  const [namespace, ...rest] = key.split('.')
  const ns = translations[namespace as keyof typeof translations]
  if (!ns) return key

  let value = getNestedValue(ns as Record<string, unknown>, rest.join('.'))

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value.replace(`{{${paramKey}}}`, String(paramValue))
    })
  }

  return value
}

export default translations
