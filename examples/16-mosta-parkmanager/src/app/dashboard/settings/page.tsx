// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { t } from '@/i18n'
import { toast } from 'sonner'
import {
  ScanFace,
  Printer,
  Loader2,
  Save,
  Check,
} from 'lucide-react'
import { useSettings } from '@/components/providers/SettingsProvider'

type TicketTemplate = 'thermal80' | 'thermal58' | 'a4'

interface AppSettings {
  faceRecognitionEnabled: boolean
  faceRecognitionThreshold: number
  faceRequireForCapture: boolean
  faceAutoVerify: boolean
  ticketTemplate: TicketTemplate
}

const defaultSettings: AppSettings = {
  faceRecognitionEnabled: true,
  faceRecognitionThreshold: 0.6,
  faceRequireForCapture: true,
  faceAutoVerify: false,
  ticketTemplate: 'thermal80',
}

export default function SettingsPage() {
  const { refresh: refreshGlobalSettings } = useSettings()
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const json = await res.json()
          const data = json.data || {}
          setSettings({
            faceRecognitionEnabled: data.faceRecognitionEnabled ?? defaultSettings.faceRecognitionEnabled,
            faceRecognitionThreshold: data.faceRecognitionThreshold ?? defaultSettings.faceRecognitionThreshold,
            faceRequireForCapture: data.faceRequireForCapture ?? defaultSettings.faceRequireForCapture,
            faceAutoVerify: data.faceAutoVerify ?? defaultSettings.faceAutoVerify,
            ticketTemplate: data.ticketTemplate ?? defaultSettings.ticketTemplate,
          })
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success(t('settings.saved'))
        await refreshGlobalSettings()
      }
    } catch {
      toast.error('Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [settings, refreshGlobalSettings])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const templates: { id: TicketTemplate; width: string }[] = [
    { id: 'thermal80', width: '80mm' },
    { id: 'thermal58', width: '58mm' },
    { id: 'a4', width: 'A4' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500">{t('settings.subtitle')}</p>
      </div>

      {/* Face Recognition */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">{t('settings.sections.faceRecognition')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Enabled */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings.faceRecognition.enabled')}</Label>
              <p className="text-xs text-gray-500">{t('settings.faceRecognition.enabledDesc')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.faceRecognitionEnabled}
              onClick={() => setSettings((s) => ({ ...s, faceRecognitionEnabled: !s.faceRecognitionEnabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.faceRecognitionEnabled ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                  settings.faceRecognitionEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings.faceRecognitionEnabled && (
            <>
              {/* Threshold */}
              <div>
                <Label className="text-sm font-medium">{t('settings.faceRecognition.threshold')}</Label>
                <p className="text-xs text-gray-500 mb-2">{t('settings.faceRecognition.thresholdDesc')}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.05"
                    value={settings.faceRecognitionThreshold}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, faceRecognitionThreshold: parseFloat(e.target.value) }))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-center text-sm font-mono font-semibold text-gray-700">
                    {settings.faceRecognitionThreshold.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                  <span>Strict</span>
                  <span>Souple</span>
                </div>
              </div>

              {/* Require face for capture */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t('settings.faceRecognition.requireFace')}</Label>
                  <p className="text-xs text-gray-500">{t('settings.faceRecognition.requireFaceDesc')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.faceRequireForCapture}
                  onClick={() => setSettings((s) => ({ ...s, faceRequireForCapture: !s.faceRequireForCapture }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings.faceRequireForCapture ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.faceRequireForCapture ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto verify */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t('settings.faceRecognition.autoVerify')}</Label>
                  <p className="text-xs text-gray-500">{t('settings.faceRecognition.autoVerifyDesc')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.faceAutoVerify}
                  onClick={() => setSettings((s) => ({ ...s, faceAutoVerify: !s.faceAutoVerify }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings.faceAutoVerify ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.faceAutoVerify ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Printing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-sky-600" />
            <div>
              <CardTitle className="text-base">{t('settings.sections.ticketPrinting')}</CardTitle>
              <CardDescription className="text-xs">{t('settings.ticketPrinting.templateDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {templates.map(({ id, width }) => (
              <button
                key={id}
                onClick={() => setSettings((s) => ({ ...s, ticketTemplate: id }))}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                  settings.ticketTemplate === id
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {settings.ticketTemplate === id && (
                  <Check className="absolute top-2 right-2 h-4 w-4 text-sky-600" />
                )}
                <div className="mb-2 flex items-center justify-center">
                  <div
                    className={`rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 ${
                      id === 'thermal80'
                        ? 'w-16 h-24'
                        : id === 'thermal58'
                          ? 'w-12 h-20'
                          : 'w-20 h-14'
                    }`}
                  >
                    {width}
                  </div>
                </div>
                <div className="font-medium text-sm text-gray-800">
                  {t(`settings.ticketPrinting.templates.${id}`)}
                </div>
                <div className="text-xs text-gray-500">
                  {t(`settings.ticketPrinting.templates.${id}Desc`)}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-sky-600 hover:bg-sky-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('settings.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('settings.save')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
