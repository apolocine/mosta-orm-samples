// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { t } from '@/i18n'
import { toast } from 'sonner'
import {
  Smartphone,
  ScanLine,
  ScanFace,
  WifiOff,
  Camera,
  Copy,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import QRCode from 'qrcode'

export default function PwaPage() {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [agentUrl, setAgentUrl] = useState('')

  useEffect(() => {
    const url = `${window.location.origin}/agent`
    setAgentUrl(url)
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setQrDataUrl)
  }, [])

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(agentUrl)
    toast.success(t('pwa.copied'))
  }, [agentUrl])

  const features = [
    { icon: ScanLine, label: t('pwa.features.scan'), color: 'text-sky-600' },
    { icon: ScanFace, label: t('pwa.features.faceVerify'), color: 'text-purple-600' },
    { icon: WifiOff, label: t('pwa.features.offline'), color: 'text-amber-600' },
    { icon: Camera, label: t('pwa.features.camera'), color: 'text-green-600' },
  ]

  const steps = [
    t('pwa.instructions.step1'),
    t('pwa.instructions.step2'),
    t('pwa.instructions.step3'),
    t('pwa.instructions.step4'),
    t('pwa.instructions.step5'),
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('pwa.title')}</h1>
        <p className="text-sm text-gray-500">{t('pwa.subtitle')}</p>
      </div>

      {/* QR Code */}
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <div className="mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-sky-600" />
            <span className="text-sm font-medium text-gray-700">{t('pwa.scanToInstall')}</span>
          </div>

          {qrDataUrl && (
            <div className="rounded-xl border-2 border-gray-100 bg-white p-4 shadow-sm">
              <img src={qrDataUrl} alt="QR Code PWA" className="h-64 w-64" />
            </div>
          )}

          {/* URL + actions */}
          <div className="mt-6 w-full max-w-sm space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('pwa.url')}
              </label>
              <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                <code className="flex-1 truncate text-sm text-gray-700">{agentUrl}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={copyUrl}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyUrl}
              >
                <Copy className="mr-2 h-4 w-4" />
                {t('pwa.copy')}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(agentUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('pwa.openInBrowser')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pwa.features.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pwa.instructions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-600">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
