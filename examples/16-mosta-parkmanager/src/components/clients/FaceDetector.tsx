// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useSettings } from '@/components/providers/SettingsProvider'

interface FaceDetectorProps {
  /** Photo existante (base64) */
  photo: string
  /** Callback quand une photo est capturée */
  onCapture: (data: { photo: string; faceDescriptor: number[] | null }) => void
  /** Callback quand la photo est supprimée */
  onClear: () => void
  /** Mode vérification : compare avec un descripteur existant */
  verifyDescriptor?: number[]
  /** Callback résultat de vérification */
  onVerifyResult?: (result: { match: boolean; distance: number } | null) => void
}

type FaceApiModule = typeof import('@/lib/faceApi')

export default function FaceDetector({
  photo,
  onCapture,
  onClear,
  verifyDescriptor,
  onVerifyResult,
}: FaceDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const faceApiRef = useRef<FaceApiModule | null>(null)

  const [streaming, setStreaming] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ match: boolean; distance: number } | null>(null)

  const { settings } = useSettings()
  const enabled = settings.faceRecognitionEnabled

  // Charger les modèles face-api au montage
  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function init() {
      setLoadingModels(true)
      try {
        const mod = await import('@/lib/faceApi')
        await mod.loadModels()
        if (!cancelled) {
          faceApiRef.current = mod
          setModelsReady(true)
        }
      } catch (err) {
        console.error('Erreur chargement modèles face-api:', err)
        if (!cancelled) {
          toast.error('Impossible de charger les modèles de détection faciale')
        }
      } finally {
        if (!cancelled) setLoadingModels(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [enabled])

  // Boucle de détection temps réel
  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !overlayRef.current || !faceApiRef.current) return
    if (videoRef.current.paused || videoRef.current.ended) return

    const video = videoRef.current
    const overlay = overlayRef.current
    const faceApi = faceApiRef.current
    const detection = await faceApi.detectFace(video)
    setFaceDetected(!!detection)

    // Re-check refs after async — component may have unmounted or camera stopped
    if (!videoRef.current || !overlayRef.current) return

    faceApi.drawDetection(overlay, detection, video.videoWidth, video.videoHeight)

    animFrameRef.current = requestAnimationFrame(detectLoop)
  }, [])

  const startCamera = useCallback(async () => {
    setVerifyResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStreaming(true)

        // Lancer la boucle de détection une fois la vidéo prête
        if (enabled && modelsReady) {
          videoRef.current.onloadeddata = () => {
            animFrameRef.current = requestAnimationFrame(detectLoop)
          }
        }
      }
    } catch {
      toast.error("Impossible d'accéder à la caméra")
    }
  }, [enabled, modelsReady, detectLoop])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setStreaming(false)
    setFaceDetected(false)
  }, [])

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

    // Extraire le descripteur facial si la feature est activée
    let descriptor: number[] | null = null
    if (enabled && modelsReady && faceApiRef.current) {
      try {
        const raw = await faceApiRef.current.extractDescriptor(canvas)
        if (raw) {
          descriptor = Array.from(raw)
        }
      } catch (err) {
        console.error('Erreur extraction descripteur:', err)
      }
    }

    stopCamera()
    onCapture({ photo: dataUrl, faceDescriptor: descriptor })
  }, [enabled, modelsReady, stopCamera, onCapture])

  // Vérification faciale (mode vérification)
  const verifyFace = useCallback(async () => {
    if (!videoRef.current || !faceApiRef.current || !verifyDescriptor) return

    try {
      const raw = await faceApiRef.current.extractDescriptor(videoRef.current)
      if (!raw) {
        setVerifyResult(null)
        onVerifyResult?.(null)
        toast.error('Aucun visage détecté')
        return
      }

      const distance = faceApiRef.current.compareFaces(raw, verifyDescriptor)
      const match = distance < settings.faceRecognitionThreshold
      const result = { match, distance }
      setVerifyResult(result)
      onVerifyResult?.(result)
    } catch (err) {
      console.error('Erreur vérification faciale:', err)
      toast.error('Erreur lors de la vérification')
    }
  }, [verifyDescriptor, onVerifyResult])

  const captureDisabled = enabled && settings.faceRequireForCapture && !faceDetected

  // Si la feature est désactivée, afficher la webcam basique
  if (!enabled) {
    return (
      <div className="space-y-4">
        {photo ? (
          <div className="relative">
            <img src={photo} alt="Photo client" className="w-full rounded-lg" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              autoPlay
              playsInline
              muted
              style={{ display: streaming ? 'block' : 'none' }}
            />
            {streaming ? (
              <div className="flex gap-2">
                <Button type="button" onClick={capturePhoto} className="flex-1">
                  Capturer
                </Button>
                <Button type="button" variant="outline" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={startCamera} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Prendre photo
              </Button>
            )}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // Mode avec détection faciale
  return (
    <div className="space-y-4">
      {photo ? (
        <div className="relative">
          <img src={photo} alt="Photo client" className="w-full rounded-lg" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Conteneur vidéo + overlay */}
          <div className="relative" style={{ display: streaming ? 'block' : 'none' }}>
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={overlayRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            {/* Indicateur de détection */}
            <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium ${
              faceDetected
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}>
              {faceDetected ? 'Visage détecté' : 'Aucun visage'}
            </div>
          </div>

          {streaming ? (
            <div className="flex gap-2">
              {verifyDescriptor ? (
                <Button
                  type="button"
                  onClick={verifyFace}
                  className="flex-1"
                  disabled={!faceDetected}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Vérifier visage
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1"
                  disabled={captureDisabled}
                >
                  {captureDisabled ? 'Cadrez votre visage...' : 'Capturer'}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {loadingModels ? (
                <Button type="button" variant="outline" disabled className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement détection faciale...
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={startCamera} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  {verifyDescriptor ? 'Vérifier visage' : 'Prendre photo'}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Résultat de vérification */}
      {verifyResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
          verifyResult.match
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {verifyResult.match ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-red-600" />
          )}
          {verifyResult.match
            ? `Visage vérifié (confiance: ${Math.round((1 - verifyResult.distance) * 100)}%)`
            : `Visage non reconnu (distance: ${verifyResult.distance.toFixed(2)})`
          }
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
