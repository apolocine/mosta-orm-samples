// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import { Download, CreditCard, User, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ClientCardProps {
  client: {
    id: string
    clientNumber: string
    clientType: string
    firstName: string
    lastName: string
    phone?: string
    email?: string
    photo?: string
    wilaya?: string
    status: string
    qrCode: string
    createdAt: string
  }
}

export default function ClientCardGenerator({ client }: ClientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')

  const generateQRCode = useCallback(async () => {
    try {
      const url = await QRCode.toDataURL(client.qrCode || client.id, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      setQrCodeData(url)
    } catch (err) {
      console.error('QR generation error:', err)
    }
  }, [client])

  useEffect(() => {
    generateQRCode()
  }, [generateQRCode])

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return
    setIsGenerating(true)
    try {
      await new Promise((r) => setTimeout(r, 300))
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        onclone: (clonedDoc) => {
          // Supprimer les stylesheets Tailwind v4 qui utilisent lab()/oklch()
          // La carte n'utilise que des styles inline, pas besoin de Tailwind
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove())
        },
      })
      const link = document.createElement('a')
      link.download = `carte_${client.clientNumber}_${client.firstName}_${client.lastName}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Card generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [client])

  const printCard = useCallback(async () => {
    if (!cardRef.current) return
    setIsGenerating(true)
    try {
      await new Promise((r) => setTimeout(r, 300))
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove())
        },
      })
      const dataUrl = canvas.toDataURL('image/png')
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      printWindow.document.write(`
        <html><head><title>Carte ${client.clientNumber}</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { width: 85.6mm; height: auto; }
          @media print { body { margin: 0; } img { width: 85.6mm; } }
        </style></head><body>
        <img src="${dataUrl}" />
        <script>window.onload=()=>{window.print();window.close()}</script>
        </body></html>
      `)
      printWindow.document.close()
    } catch (err) {
      console.error('Print error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [client])

  const statusLabel: Record<string, string> = {
    active: 'ACTIF',
    inactive: 'INACTIF',
    suspended: 'SUSPENDU',
  }

  // Use hex colors (not Tailwind classes) — html2canvas cannot parse lab()/oklch() from Tailwind v4
  const statusColor: Record<string, string> = {
    active: '#22c55e',
    inactive: '#6b7280',
    suspended: '#ef4444',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4" />
          Carte Abonné
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Card preview — ALL inline styles inside cardRef (html2canvas cannot parse Tailwind v4 lab/oklch colors) */}
        <div className="bg-gray-100 p-3 rounded-lg">
          <div
            ref={cardRef}
            style={{
              width: '340px',
              height: '214px',
              margin: '0 auto',
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                position: 'relative',
                height: '100%',
                width: '100%',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #0369a1 0%, #1e40af 50%, #6d28d9 100%)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 20px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
                    Mosta ParkManager
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.85, fontFamily: 'Arial, sans-serif' }}>
                    Carte d&apos;Abonné
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: statusColor[client.status] || '#3b82f6',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {statusLabel[client.status] || client.status.toUpperCase()}
                </div>
              </div>

              {/* Main content */}
              <div style={{ display: 'flex', gap: '12px', padding: '12px 20px' }}>
                {/* Left: photo + info */}
                <div style={{ flex: 1, fontFamily: 'Arial, sans-serif' }}>
                  {/* Photo */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {client.photo ? (
                      <img
                        src={client.photo}
                        alt={`${client.firstName} ${client.lastName}`}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <User style={{ width: '32px', height: '32px', opacity: 0.6 }} />
                    )}
                  </div>

                  {/* Name + number */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      {client.firstName} {client.lastName}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.85 }}>
                      N° {client.clientNumber}
                    </div>
                  </div>

                  {/* Wilaya */}
                  {client.wilaya && (
                    <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                      {client.wilaya}
                    </div>
                  )}
                </div>

                {/* Right: QR code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {qrCodeData && (
                    <div style={{ backgroundColor: '#ffffff', padding: '6px', borderRadius: '4px' }}>
                      <img
                        src={qrCodeData}
                        alt="QR Code"
                        style={{ width: '80px', height: '80px' }}
                      />
                    </div>
                  )}
                  <div style={{ fontSize: '8px', marginTop: '4px', opacity: 0.8, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                    Code d&apos;accès
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 20px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                <span style={{ fontSize: '9px' }}>
                  Membre depuis {new Date(client.createdAt).getFullYear()}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 600 }}>
                  Mosta ParkManager
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={printCard}
            disabled={isGenerating}
            size="sm"
            className="flex-1"
          >
            <Printer className="mr-2 h-4 w-4" />
            {isGenerating ? 'Génération...' : 'Imprimer'}
          </Button>
          <Button
            onClick={downloadCard}
            disabled={isGenerating}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
