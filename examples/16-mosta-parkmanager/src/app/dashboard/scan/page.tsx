// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScanLine, Camera, RefreshCw, ShieldCheck, ShieldAlert, ScanFace, CameraOff } from 'lucide-react'
import { t } from '@/i18n'
import { toast } from 'sonner'
import { useSettings } from '@/components/providers/SettingsProvider'
import FaceDetector from '@/components/clients/FaceDetector'

interface ScanResult {
  result: 'granted' | 'denied'
  reason?: string
  isReentry?: boolean
  ticket?: {
    ticketNumber: string
    clientName: string
    activityName: string
    ticketType: string
    validityMode: string
    status: string
  }
  client?: {
    name: string
    clientNumber: string
    photo?: string
    faceDescriptor?: number[]
  }
  access?: {
    remainingQuota: number | null
    totalQuota: number | null
    endDate: string | null
    status: string
  }
}

export default function ScanPage() {
  const { settings } = useSettings()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const scannerRef = useRef<any>(null)
  const [showFaceVerify, setShowFaceVerify] = useState(false)
  const [faceVerifyResult, setFaceVerifyResult] = useState<{ match: boolean; distance: number } | null>(null)

  const startScanner = useCallback(async () => {
    setResult(null)
    setShowFaceVerify(false)
    setFaceVerifyResult(null)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processing) return
          setProcessing(true)
          await scanner.stop()
          setScanning(false)
          await handleScan(decodedText)
          setProcessing(false)
        },
        () => {}
      )
      setScanning(true)
    } catch (err: any) {
      console.error('Scanner error:', err)
      const msg = String(err?.message || err || '')
      if (msg.includes('NotFound') || msg.includes('Requested device not found') || msg.includes('no camera')) {
        toast.error('Caméra non trouvée. Vérifiez la connexion de votre caméra.')
      } else if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        toast.error('Accès caméra refusé. Autorisez l\'accès dans les paramètres du navigateur.')
      } else {
        toast.error(`Erreur caméra : ${msg || 'impossible de démarrer le scanner'}`)
      }
    }
  }, [processing])

  async function handleScan(qrCode: string) {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, scanMethod: 'webcam' }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const msg = err?.error?.message || `Erreur serveur (${res.status})`
        setResult({ result: 'denied', reason: msg })
        playSound(300, 400)
        return
      }

      const data = await res.json()
      setResult(data.data)

      // Play sound
      if (data.data.result === 'granted') {
        playSound(800, 200)
      } else {
        playSound(300, 400)
      }
    } catch {
      setResult({ result: 'denied', reason: 'Erreur de connexion' })
      playSound(300, 400)
    }
  }

  function playSound(freq: number, duration: number) {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(ctx.destination)
      osc.start()
      setTimeout(() => { osc.stop(); ctx.close() }, duration)
    } catch {}
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('scan.title')}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              {t('scan.scan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="qr-reader" className="w-full min-h-[300px] bg-gray-900 rounded-lg overflow-hidden" />
            <div className="mt-4 flex gap-2">
              {!scanning ? (
                <Button onClick={startScanner} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Démarrer le scanner
                </Button>
              ) : (
                <Button variant="outline" onClick={() => {
                  scannerRef.current?.stop().catch(() => {})
                  setScanning(false)
                }} className="w-full">
                  Arrêter
                </Button>
              )}
              {result && (
                <Button variant="outline" onClick={startScanner}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <div className="space-y-4">
          {result ? (
            <Card className={result.result === 'granted'
              ? result.isReentry ? 'border-blue-500 border-2' : 'border-green-500 border-2'
              : 'border-red-500 border-2'
            }>
              <CardContent className="pt-6">
                <div className={`text-center p-6 rounded-lg ${
                  result.result === 'granted'
                    ? result.isReentry ? 'bg-blue-50' : 'bg-green-50'
                    : 'bg-red-50'
                }`}>
                  <div className={`text-4xl font-bold mb-2 ${
                    result.result === 'granted'
                      ? result.isReentry ? 'text-blue-600' : 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {result.result === 'granted' ? (result.isReentry ? '🔄' : '✅') : '❌'}
                  </div>
                  <div className={`text-2xl font-bold ${
                    result.result === 'granted'
                      ? result.isReentry ? 'text-blue-700' : 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {result.isReentry ? 'RÉENTRÉE AUTORISÉE' : t(`scan.result.${result.result}`)}
                  </div>
                  {result.isReentry && (
                    <div className="text-sm mt-1 text-blue-600">
                      Ticket déjà validé — réentrée journée
                    </div>
                  )}
                  {result.reason && (
                    <div className="text-sm mt-2 text-red-600">
                      {result.reason.startsWith('ticket_') || result.reason.startsWith('quota_') || result.reason.startsWith('access_') || result.reason.startsWith('client_') || result.reason === 'invalid_ticket'
                        ? t(`scan.denyReasons.${result.reason}`)
                        : result.reason}
                    </div>
                  )}
                </div>

                {result.client && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {result.client.photo ? (
                        <img src={result.client.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500">
                          {result.client.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{result.client.name}</div>
                        <div className="text-sm text-gray-500">{result.client.clientNumber}</div>
                      </div>
                    </div>

                    {result.ticket && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('scan.info.activity')}</span>
                          <span className="font-medium">{result.ticket.activityName}</span>
                        </div>
                        {result.access && result.access.remainingQuota != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t('scan.info.quotaRemaining')}</span>
                            <span className="font-bold text-lg">{result.access.remainingQuota}</span>
                          </div>
                        )}
                        {result.ticket.ticketType === 'cadeau' && (
                          <Badge className="bg-amber-100 text-amber-800">{t('tickets.types.cadeau')}</Badge>
                        )}
                      </div>
                    )}

                    {/* Vérification faciale après scan */}
                    {settings.faceRecognitionEnabled && result.result === 'granted' && result.client?.faceDescriptor?.length === 128 && (
                      <div className="mt-4 border-t pt-3 space-y-2">
                        {!showFaceVerify ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setShowFaceVerify(true); setFaceVerifyResult(null) }}
                            className="w-full"
                          >
                            <ScanFace className="mr-2 h-4 w-4" />
                            Vérifier visage
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <FaceDetector
                              photo=""
                              onCapture={() => {}}
                              onClear={() => {}}
                              verifyDescriptor={result.client.faceDescriptor}
                              onVerifyResult={(r) => { setFaceVerifyResult(r); setShowFaceVerify(false) }}
                            />
                          </div>
                        )}

                        {faceVerifyResult && (
                          <div className={`flex items-center gap-2 p-2 rounded text-sm font-medium ${
                            faceVerifyResult.match
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {faceVerifyResult.match ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <ShieldAlert className="h-4 w-4" />
                            )}
                            {faceVerifyResult.match
                              ? `Visage vérifié (${Math.round((1 - faceVerifyResult.distance) * 100)}%)`
                              : 'Visage non reconnu'
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-400">
                  <ScanLine className="mx-auto h-12 w-12 mb-4" />
                  <p>Scannez un ticket QR pour vérifier l'accès</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
