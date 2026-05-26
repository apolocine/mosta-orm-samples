// Author: Dr Hamid MADANI drmdh@msn.com
/** Server-side settings helper — uses DAL (NOT safe for client import) */
import { settingRepo } from '@/dal/service'
import { DEFAULTS } from '@/lib/settings-defaults'
import type { AppSettings } from '@/lib/settings-defaults'

export { DEFAULTS }
export type { AppSettings }

/**
 * Load settings from the database (server-side).
 * Merges DB values over defaults so every key is always present.
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const repo = await settingRepo()
    const db = await repo.findAllSettings()
    return {
      faceRecognitionEnabled:
        typeof db.faceRecognitionEnabled === 'boolean'
          ? db.faceRecognitionEnabled
          : DEFAULTS.faceRecognitionEnabled,
      faceRecognitionThreshold:
        typeof db.faceRecognitionThreshold === 'number'
          ? db.faceRecognitionThreshold
          : DEFAULTS.faceRecognitionThreshold,
      faceRequireForCapture:
        typeof db.faceRequireForCapture === 'boolean'
          ? db.faceRequireForCapture
          : DEFAULTS.faceRequireForCapture,
      faceAutoVerify:
        typeof db.faceAutoVerify === 'boolean'
          ? db.faceAutoVerify
          : DEFAULTS.faceAutoVerify,
      ticketTemplate:
        (db.ticketTemplate as AppSettings['ticketTemplate']) || DEFAULTS.ticketTemplate,
    }
  } catch {
    return { ...DEFAULTS }
  }
}
