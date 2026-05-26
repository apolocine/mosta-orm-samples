// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n'
import { useSettings } from '@/components/providers/SettingsProvider'
import {
  ScanLine,
  Search,
  ScanFace,
  UserPlus,
  ArrowLeft,
  Ticket,
  Printer,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Gift,
  X,
  CreditCard,
  Plus,
} from 'lucide-react'
import QRCode from 'qrcode'

const FaceDetector = dynamic(
  () => import('@/components/clients/FaceDetector'),
  { ssr: false }
)

interface ClientInfo {
  id: string
  firstName: string
  lastName: string
  clientNumber: string
  clientType: string
  photo?: string
  status: string
}

interface AccessInfo {
  id: string
  activity: {
    id: string
    name: string
    color?: string
    ticketValidityMode: string
    price: number
  }
  accessType: string
  totalQuota: number | null
  remainingQuota: number | null
  status: string
  ticketCount: number
  scanCount: number
  endDate?: string
}

interface GeneratedTicket {
  id: string
  ticketNumber: string
  qrCode: string
  activityName: string
  clientName: string
  validityMode: string
  validUntil: string | null
  ticketType: string
  qrDataUrl?: string
}

interface AvailableActivity {
  id: string
  name: string
  slug: string
  color?: string
  ticketValidityMode: string
  price: number
}

interface PlanInfo {
  id: string
  name: string
  description?: string
  type: 'temporal' | 'usage' | 'mixed'
  duration: number | null
  activities: { activity: { id: string; name: string; slug: string }; sessionsCount: number | null }[]
  price: number
  currency: string
  isActive: boolean
}

export default function ReceptionPage() {
  const { settings } = useSettings()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [client, setClient] = useState<ClientInfo | null>(null)
  const [accesses, setAccesses] = useState<AccessInfo[]>([])
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedTicket[]>([])

  // Step 1 sub-modes
  const [mode, setMode] = useState<'menu' | 'scan' | 'search' | 'face' | 'visitor'>(
    'menu'
  )

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientInfo[]>([])
  const [searching, setSearching] = useState(false)

  // Scan state
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<any>(null)
  const [scanError, setScanError] = useState('')

  // Face state
  const [faceIdentifying, setFaceIdentifying] = useState(false)

  // Visitor form state
  const [visitorForm, setVisitorForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [creatingVisitor, setCreatingVisitor] = useState(false)

  // Step 3 state
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set())
  const [isGift, setIsGift] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Available plans & activities (for clients without access)
  const [availableActivities, setAvailableActivities] = useState<AvailableActivity[]>([])
  const [availablePlans, setAvailablePlans] = useState<PlanInfo[]>([])
  const [assigningAccess, setAssigningAccess] = useState(false)

  // Loading
  const [loadingProfile, setLoadingProfile] = useState(false)

  // --- Helpers ---

  const reset = useCallback(() => {
    setStep(1)
    setMode('menu')
    setClient(null)
    setAccesses([])
    setGeneratedTickets([])
    setSearchQuery('')
    setSearchResults([])
    setScanError('')
    setSelectedActivities(new Set())
    setIsGift(false)
    setVisitorForm({ firstName: '', lastName: '', phone: '' })
    setAvailableActivities([])
    setAvailablePlans([])
  }, [])

  const loadClientProfile = useCallback(async (clientData: ClientInfo) => {
    setClient(clientData)
    setLoadingProfile(true)
    try {
      const [accessRes, plansRes] = await Promise.all([
        fetch(`/api/clients/${clientData.id}/access`),
        fetch('/api/subscription-plans'),
      ])

      if (accessRes.ok) {
        const json = await accessRes.json()
        const activeAccesses = (json.data.accesses || []).filter(
          (a: AccessInfo) => a.status === 'active'
        )
        setAccesses(activeAccesses)
        setAvailableActivities(json.data.activities || [])
      }

      if (plansRes.ok) {
        const json = await plansRes.json()
        setAvailablePlans(
          (json.data || []).filter((p: PlanInfo) => p.isActive)
        )
      }
    } catch (err) {
      console.error('Error loading accesses:', err)
    } finally {
      setLoadingProfile(false)
      setStep(2)
    }
  }, [])

  // --- Step 1: QR Scanner ---

  const startScanner = useCallback(async () => {
    setScanError('')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('reception-qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop()
          setScanning(false)
          scannerRef.current = null

          // Identify the QR code
          try {
            const res = await fetch('/api/identify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qrCode: decodedText }),
            })

            if (!res.ok) {
              setScanError(t('reception.identify.unknownQr'))
              return
            }

            const json = await res.json()
            const { type, client: foundClient, ticket } = json.data

            if (type === 'client') {
              await loadClientProfile(foundClient)
            } else if (type === 'ticket' && ticket?.client) {
              await loadClientProfile(ticket.client as ClientInfo)
            } else {
              setScanError(t('reception.identify.unknownQr'))
            }
          } catch {
            setScanError(t('reception.identify.unknownQr'))
          }
        },
        () => {}
      )
      setScanning(true)
    } catch (err) {
      console.error('Scanner error:', err)
    }
  }, [loadClientProfile])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }, [])

  // --- Step 1: Search ---

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/clients/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const json = await res.json()
        setSearchResults(json.data || [])
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // --- Step 1: Face Recognition ---

  const handleFaceCapture = useCallback(
    async (data: { photo: string; faceDescriptor: number[] | null }) => {
      if (!data.faceDescriptor) return
      setFaceIdentifying(true)
      try {
        const res = await fetch('/api/face/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faceDescriptor: data.faceDescriptor }),
        })

        if (res.ok) {
          const json = await res.json()
          if (json.data.match && json.data.client) {
            await loadClientProfile(json.data.client)
            return
          }
        }
        // No match
        setScanError(t('reception.identify.faceNoMatch'))
      } catch {
        setScanError(t('reception.identify.faceNoMatch'))
      } finally {
        setFaceIdentifying(false)
      }
    },
    [loadClientProfile]
  )

  // --- Step 1: New Visitor ---

  const handleCreateVisitor = useCallback(async () => {
    if (!visitorForm.firstName.trim() || !visitorForm.lastName.trim()) return
    setCreatingVisitor(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: visitorForm.firstName.trim(),
          lastName: visitorForm.lastName.trim(),
          phone: visitorForm.phone.trim() || undefined,
          clientType: 'visiteur',
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const newClient = json.data || json
        await loadClientProfile({
          id: newClient.id,
          firstName: newClient.firstName,
          lastName: newClient.lastName,
          clientNumber: newClient.clientNumber,
          clientType: newClient.clientType,
          photo: newClient.photo,
          status: newClient.status,
        })
      }
    } catch (err) {
      console.error('Error creating visitor:', err)
    } finally {
      setCreatingVisitor(false)
    }
  }, [visitorForm, loadClientProfile])

  // --- Step 2: Assign access ---

  const handleAssignPlan = useCallback(
    async (planId: string) => {
      if (!client) return
      setAssigningAccess(true)
      try {
        const res = await fetch(`/api/clients/${client.id}/access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        })
        if (res.ok) {
          // Reload profile to refresh accesses
          await loadClientProfile(client)
        }
      } catch (err) {
        console.error('Error assigning plan:', err)
      } finally {
        setAssigningAccess(false)
      }
    },
    [client, loadClientProfile]
  )

  const handleAssignActivity = useCallback(
    async (activityId: string) => {
      if (!client) return
      setAssigningAccess(true)
      try {
        const res = await fetch(`/api/clients/${client.id}/access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityId,
            accessType: 'unlimited',
          }),
        })
        if (res.ok) {
          await loadClientProfile(client)
        }
      } catch (err) {
        console.error('Error assigning activity:', err)
      } finally {
        setAssigningAccess(false)
      }
    },
    [client, loadClientProfile]
  )

  // --- Step 3: Generate Tickets ---

  const handleGenerateTickets = useCallback(async () => {
    if (!client || selectedActivities.size === 0) return
    setGenerating(true)

    const tickets: GeneratedTicket[] = []

    for (const activityId of selectedActivities) {
      try {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client.id,
            activityId,
            ticketType: isGift ? 'cadeau' : 'standard',
          }),
        })

        if (res.ok) {
          const json = await res.json()
          const ticket = json.data
          const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
            width: 120,
            margin: 1,
          })
          tickets.push({ ...ticket, qrDataUrl })
        }
      } catch (err) {
        console.error('Error generating ticket:', err)
      }
    }

    setGeneratedTickets(tickets)
    setStep(4)
    setGenerating(false)
  }, [client, selectedActivities, isGift])

  // --- Step 4: Print ---

  const handlePrint = useCallback(async () => {
    if (generatedTickets.length === 0) return

    const tpl = settings.ticketTemplate
    const pageSize = tpl === 'thermal58' ? '58mm auto' : tpl === 'a4' ? 'A4' : '80mm auto'
    const ticketWidth = tpl === 'thermal58' ? '50mm' : tpl === 'a4' ? '100%' : '72mm'
    const qrSize = tpl === 'a4' ? 200 : 150

    let ticketsHtml = ''
    for (const ticket of generatedTickets) {
      const qrUrl =
        ticket.qrDataUrl ||
        (await QRCode.toDataURL(ticket.qrCode, { width: qrSize, margin: 1 }))
      ticketsHtml += `
        <div class="ticket-page">
          <div style="text-align:center; font-weight:bold; font-size:16px; color:#0ea5e9;">Mosta ParkManager</div>
          <hr style="margin:6px 0; border:none; border-top:1px dashed #ccc;">
          <div style="text-align:center;">
            <div style="font-weight:bold; font-size:15px; margin-bottom:2px;">${ticket.activityName}</div>
            <div style="font-size:12px; color:#666;">${ticket.clientName}</div>
          </div>
          <div style="text-align:center; margin:10px 0;">
            <img src="${qrUrl}" width="${qrSize}" height="${qrSize}" />
          </div>
          <div style="text-align:center; font-size:11px; font-family:monospace; color:#999;">${ticket.ticketNumber}</div>
          ${ticket.ticketType === 'cadeau' ? '<div style="text-align:center; color:#f59e0b; font-weight:bold; font-size:12px; margin-top:4px;">TICKET CADEAU</div>' : ''}
          ${ticket.validUntil ? `<div style="text-align:center; font-size:11px; color:#666; margin-top:4px;">Expire : ${new Date(ticket.validUntil).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>` : ''}
          <hr style="margin:6px 0; border:none; border-top:1px dashed #ccc;">
        </div>
      `
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Tickets</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            .ticket-page {
              width: ${ticketWidth};
              padding: 8px 4px;
              page-break-after: always;
            }
            .ticket-page:last-child { page-break-after: auto; }
            @media print {
              @page { size: ${pageSize}; margin: 4mm; }
              .ticket-page { page-break-after: always; }
              .ticket-page:last-child { page-break-after: auto; }
            }
          </style>
        </head>
        <body>${ticketsHtml}
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [generatedTickets, settings.ticketTemplate])

  // --- Render ---

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('reception.title')}
          </h1>
          <p className="text-sm text-gray-500">{t('reception.subtitle')}</p>
        </div>
        {step > 1 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {t(`reception.steps.${
              step === 2 ? 'profile' : step === 3 ? 'selection' : 'tickets'
            }`)}
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
              {step}/4
            </span>
          </div>
        )}
      </div>

      {/* ============ STEP 1: IDENTIFICATION ============ */}
      {step === 1 && (
        <>
          {mode === 'menu' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-700">
                {t('reception.identify.title')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setMode('scan')
                    setScanError('')
                  }}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-sky-400 hover:bg-sky-50"
                >
                  <ScanLine className="h-10 w-10 text-sky-600" />
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">
                      {t('reception.identify.scanQr')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('reception.identify.scanQrDesc')}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode('search')
                    setScanError('')
                  }}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-amber-400 hover:bg-amber-50"
                >
                  <Search className="h-10 w-10 text-amber-600" />
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">
                      {t('reception.identify.search')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('reception.identify.searchDesc')}
                    </div>
                  </div>
                </button>

                {settings.faceRecognitionEnabled && (
                  <button
                    onClick={() => {
                      setMode('face')
                      setScanError('')
                    }}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-purple-400 hover:bg-purple-50"
                  >
                    <ScanFace className="h-10 w-10 text-purple-600" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-800">
                        {t('reception.identify.faceRecognition')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('reception.identify.faceRecognitionDesc')}
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMode('visitor')
                    setScanError('')
                  }}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-green-400 hover:bg-green-50"
                >
                  <UserPlus className="h-10 w-10 text-green-600" />
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">
                      {t('reception.identify.newVisitor')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('reception.identify.newVisitorDesc')}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* QR Scanner sub-mode */}
          {mode === 'scan' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{t('reception.identify.scanQr')}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    stopScanner()
                    setMode('menu')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  id="reception-qr-reader"
                  className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-black"
                />
                {!scanning && (
                  <Button onClick={startScanner} className="w-full bg-sky-600 hover:bg-sky-700">
                    <ScanLine className="mr-2 h-4 w-4" />
                    {t('reception.identify.scanning')}
                  </Button>
                )}
                {scanError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {scanError}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search sub-mode */}
          {mode === 'search' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{t('reception.identify.search')}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMode('menu')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t('reception.identify.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                {searching && (
                  <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  </div>
                )}

                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {t('reception.identify.searchNoResults')}
                  </p>
                )}

                {searchResults.length > 0 && (
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {searchResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => loadClientProfile(c)}
                        className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
                      >
                        {c.photo ? (
                          <img
                            src={c.photo}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                            {c.firstName.charAt(0)}
                            {c.lastName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {c.clientNumber} — {c.clientType}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Face Recognition sub-mode */}
          {mode === 'face' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">
                  {t('reception.identify.faceRecognition')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMode('menu')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {faceIdentifying ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <p className="text-sm text-gray-500">Identification en cours...</p>
                  </div>
                ) : (
                  <FaceDetector
                    photo=""
                    onCapture={handleFaceCapture}
                    onClear={() => {}}
                  />
                )}
                {scanError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {scanError}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* New Visitor sub-mode */}
          {mode === 'visitor' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">
                  {t('reception.visitor.title')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMode('menu')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('reception.visitor.firstName')} *
                  </label>
                  <Input
                    value={visitorForm.firstName}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('reception.visitor.lastName')} *
                  </label>
                  <Input
                    value={visitorForm.lastName}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('reception.visitor.phone')}
                  </label>
                  <Input
                    value={visitorForm.phone}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="0555123456"
                  />
                </div>
                <Button
                  onClick={handleCreateVisitor}
                  disabled={
                    creatingVisitor ||
                    !visitorForm.firstName.trim() ||
                    !visitorForm.lastName.trim()
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {creatingVisitor ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('reception.visitor.creating')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('reception.visitor.create')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ============ STEP 2: CLIENT PROFILE ============ */}
      {step === 2 && client && (
        <div className="space-y-4">
          {/* Client card */}
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              {client.photo ? (
                <img
                  src={client.photo}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover border-2 border-sky-200"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700">
                  {client.firstName.charAt(0)}
                  {client.lastName.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {client.firstName} {client.lastName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{client.clientNumber}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      client.clientType === 'abonne'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {client.clientType === 'abonne' ? 'Abonné' : 'Visiteur'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active accesses */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-600">
              {t('reception.profile.activeAccesses')}
            </h3>
            {loadingProfile ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : accesses.length > 0 ? (
              <div className="space-y-2">
                {accesses.map((access) => {
                  const remaining =
                    access.totalQuota != null
                      ? access.totalQuota - access.ticketCount
                      : null
                  const depleted = remaining != null && remaining <= 0

                  return (
                    <div
                      key={access.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        depleted ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: access.activity.color || '#6b7280',
                          }}
                        />
                        <span className="font-medium text-gray-800">
                          {access.activity.name}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          depleted
                            ? 'text-red-600'
                            : remaining != null
                              ? 'text-gray-700'
                              : 'text-green-600'
                        }`}
                      >
                        {depleted
                          ? t('reception.profile.depleted')
                          : remaining != null
                            ? t('reception.profile.remaining', { count: remaining })
                            : t('reception.profile.unlimited')}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* No active accesses — show assign section */
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    {t('reception.profile.assignAccessDesc')}
                  </p>
                </div>

                {/* Subscription plans */}
                {availablePlans.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      {t('reception.profile.plans')}
                    </h4>
                    <div className="space-y-2">
                      {availablePlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800">{plan.name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="rounded bg-gray-100 px-1.5 py-0.5">
                                {t(`reception.profile.planType.${plan.type}`)}
                              </span>
                              {plan.duration && (
                                <span>{t('reception.profile.days', { count: plan.duration })}</span>
                              )}
                              <span>{plan.price} {plan.currency}</span>
                            </div>
                            {plan.activities.length > 0 && (
                              <div className="mt-1 text-xs text-gray-400">
                                {plan.activities.map((a) => a.activity?.name || '').filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={assigningAccess}
                            onClick={() => handleAssignPlan(plan.id)}
                            className="ml-3 shrink-0 text-sky-700 border-sky-300 hover:bg-sky-50"
                          >
                            {assigningAccess ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Plus className="mr-1 h-3 w-3" />
                                {t('reception.profile.assignPlan')}
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual activities */}
                {availableActivities.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <Ticket className="h-4 w-4" />
                      {t('reception.profile.activities')}
                    </h4>
                    <div className="space-y-2">
                      {availableActivities.map((activity) => {
                        // Check if client already has active access for this activity
                        const hasAccess = accesses.some(
                          (a) => a.activity.id === activity.id
                        )
                        if (hasAccess) return null

                        return (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: activity.color || '#6b7280' }}
                              />
                              <div>
                                <div className="font-medium text-gray-800">{activity.name}</div>
                                <div className="text-xs text-gray-500">
                                  {activity.price > 0 ? `${activity.price} DA` : 'Gratuit'}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={assigningAccess}
                              onClick={() => handleAssignActivity(activity.id)}
                              className="shrink-0 text-sky-700 border-sky-300 hover:bg-sky-50"
                            >
                              {assigningAccess ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="mr-1 h-3 w-3" />
                                  {t('reception.profile.assignActivity')}
                                </>
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {availablePlans.length === 0 && availableActivities.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-400">
                    {t('reception.profile.noAccess')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('reception.profile.back')}
            </Button>
            {accesses.length > 0 && (
              <Button
                onClick={() => setStep(3)}
                className="flex-1 bg-sky-600 hover:bg-sky-700"
              >
                <Ticket className="mr-2 h-4 w-4" />
                {t('reception.profile.createTickets')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ============ STEP 3: ACTIVITY SELECTION ============ */}
      {step === 3 && client && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {t('reception.selection.title')}
          </h2>

          <div className="space-y-2">
            {accesses.map((access) => {
              const remaining =
                access.totalQuota != null
                  ? access.totalQuota - access.ticketCount
                  : null
              const depleted = remaining != null && remaining <= 0
              const checked = selectedActivities.has(access.activity.id)

              return (
                <label
                  key={access.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    depleted
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                      : checked
                        ? 'border-sky-400 bg-sky-50'
                        : 'border-gray-200 bg-white hover:border-sky-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={depleted}
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selectedActivities)
                      if (e.target.checked) {
                        next.add(access.activity.id)
                      } else {
                        next.delete(access.activity.id)
                      }
                      setSelectedActivities(next)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: access.activity.color || '#6b7280',
                    }}
                  />
                  <span className="flex-1 font-medium text-gray-800">
                    {access.activity.name}
                  </span>
                  <span
                    className={`text-sm ${
                      depleted ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    {depleted
                      ? t('reception.selection.quotaDepleted')
                      : remaining != null
                        ? t('reception.selection.quotaRemaining', {
                            used: access.ticketCount,
                            total: access.totalQuota!,
                          })
                        : t('reception.selection.quotaUnlimited')}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Gift ticket toggle */}
          {client.clientType === 'abonne' && (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <Gift className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                {t('reception.selection.giftTicket')}
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('reception.profile.back')}
            </Button>
            <Button
              onClick={handleGenerateTickets}
              disabled={selectedActivities.size === 0 || generating}
              className="flex-1 bg-sky-600 hover:bg-sky-700"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('reception.selection.generating')}
                </>
              ) : (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  {t('reception.selection.generate', {
                    count: selectedActivities.size,
                  })}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ============ STEP 4: GENERATED TICKETS ============ */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-700">
              {t('reception.result.title')}
            </h2>
          </div>

          {generatedTickets.length === 0 ? (
            <p className="py-6 text-center text-sm text-red-500">
              {t('reception.result.error')}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {generatedTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="flex flex-col items-center p-5">
                    <div className="mb-2 text-sm font-bold text-gray-800">
                      {ticket.activityName}
                    </div>
                    <div className="mb-3 text-xs text-gray-500">
                      {ticket.clientName}
                    </div>
                    {ticket.qrDataUrl && (
                      <img
                        src={ticket.qrDataUrl}
                        alt="QR"
                        className="h-28 w-28"
                      />
                    )}
                    <div className="mt-2 text-xs font-mono text-gray-400">
                      {ticket.ticketNumber}
                    </div>
                    {ticket.validUntil && (
                      <div className="mt-2 text-xs text-gray-500">
                        Expire : {new Date(ticket.validUntil).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                    {ticket.ticketType === 'cadeau' && (
                      <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Cadeau
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {generatedTickets.length > 0 && (
              <Button onClick={handlePrint} variant="outline" className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                {t('reception.result.print')}
              </Button>
            )}
            <Button onClick={reset} className="flex-1 bg-sky-600 hover:bg-sky-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('reception.result.newClient')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
