// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '@/lib/settings-defaults'
import { DEFAULTS } from '@/lib/settings-defaults'

interface SettingsContextValue {
  settings: AppSettings
  loading: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  loading: true,
  refresh: async () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const json = await res.json()
        setSettings({ ...DEFAULTS, ...json.data })
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
