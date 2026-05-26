// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Ticket, Loader2, Search, Printer, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/i18n'
import QRCode from 'qrcode'
import { useSettings } from '@/components/providers/SettingsProvider'

interface ClientResult {
  id: string
  clientNumber: string
  firstName: string
  lastName: string
  clientType: string
}

interface ActivityOption {
  id: string
  name: string
  ticketValidityMode: string
  price: number
}

interface GeneratedTicket {
  id: string
  ticketNumber: string
  clientName: string
  activityName: string
  validityMode: string
  validUntil: string | null
  qrCode: string
  amount: number
  ticketType: string
}

export default function TicketsPage() {
  const { settings } = useSettings()
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientResult | null>(null)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [isGift, setIsGift] = useState(false)
  const [giftSourceSearch, setGiftSourceSearch] = useState('')
  const [giftSource, setGiftSource] = useState<ClientResult | null>(null)
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedTicket[]>([])

  const { data: searchResults } = useQuery({
    queryKey: ['clientSearch', search],
    queryFn: async () => {
      if (search.length < 2) return []
      const res = await fetch(`/api/clients/search?q=${search}`)
      if (!res.ok) return []
      return (await res.json()).data as ClientResult[]
    },
    enabled: search.length >= 2,
  })

  const { data: giftSearchResults } = useQuery({
    queryKey: ['clientSearch', giftSourceSearch],
    queryFn: async () => {
      if (giftSourceSearch.length < 2) return []
      const res = await fetch(`/api/clients/search?q=${giftSourceSearch}`)
      if (!res.ok) return []
      return (await res.json()).data as ClientResult[]
    },
    enabled: giftSourceSearch.length >= 2 && isGift,
  })

  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activities')
      if (!res.ok) return []
      return (await res.json()).data as ActivityOption[]
    },
  })

  const generateMutation = useMutation({
    mutationFn: async ({ clientId, activityId, ticketType, sourceClientId, amount }: any) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, activityId, ticketType, sourceClientId, amount }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
      return (await res.json()).data
    },
  })

  async function handleGenerate() {
    if (!selectedClient || selectedActivities.length === 0) {
      toast.error('Sélectionnez un client et au moins une activité')
      return
    }

    const tickets: GeneratedTicket[] = []
    for (const actId of selectedActivities) {
      const activity = activities?.find((a) => a.id === actId)
      try {
        const ticket = await generateMutation.mutateAsync({
          clientId: selectedClient.id,
          activityId: actId,
          ticketType: isGift ? 'cadeau' : 'standard',
          sourceClientId: isGift ? giftSource?.id : undefined,
          amount: selectedClient.clientType === 'visiteur' ? (activity?.price || 0) : 0,
        })
        tickets.push(ticket)
      } catch (err: any) {
        toast.error(`${activity?.name}: ${err.message}`)
      }
    }

    if (tickets.length > 0) {
      setGeneratedTickets(tickets)
      toast.success(`${tickets.length} ticket(s) généré(s)`)
    }
  }

  async function printTickets() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const tpl = settings.ticketTemplate
    const pageSize = tpl === 'thermal58' ? '58mm auto' : tpl === 'a4' ? 'A4' : '80mm auto'
    const ticketWidth = tpl === 'thermal58' ? '50mm' : tpl === 'a4' ? '100%' : '72mm'
    const qrSize = tpl === 'a4' ? 200 : 150

    let ticketsHtml = ''
    for (const ticket of generatedTickets) {
      const qrUrl = await QRCode.toDataURL(ticket.qrCode, { width: qrSize, margin: 1 })
      ticketsHtml += `
        <div class="ticket-page">
          <div style="text-align:center; font-weight:bold; font-size:16px; color:#0ea5e9;">Mosta ParkManager</div>
          <hr style="margin:6px 0; border:none; border-top:1px dashed #ccc;">
          <div style="text-align:center;">
            <div style="font-weight:bold; font-size:15px; margin-bottom:2px;">${ticket.activityName}</div>
            <div style="font-size:12px; color:#666;">${ticket.clientName}</div>
            <div style="font-size:10px; color:#999;">N\u00b0 ${ticket.ticketNumber}</div>
          </div>
          ${ticket.ticketType === 'cadeau' ? '<div style="text-align:center; color:#f59e0b; font-weight:bold; font-size:12px; margin-top:4px;">TICKET CADEAU</div>' : ''}
          ${ticket.validUntil ? `<div style="text-align:center; font-size:11px; color:#666; margin-top:2px;">Valable: ${new Date(ticket.validUntil).toLocaleString('fr-FR')}</div>` : ''}
          ${ticket.amount > 0 ? `<div style="text-align:center; font-size:12px; font-weight:bold; margin-top:2px;">${ticket.amount} DA</div>` : ''}
          <div style="text-align:center; margin:10px 0;">
            <img src="${qrUrl}" width="${qrSize}" height="${qrSize}" />
          </div>
          <hr style="margin:6px 0; border:none; border-top:1px dashed #ccc;">
        </div>
      `
    }

    printWindow.document.write(`
      <html><head><title>Tickets</title>
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
      </head><body>${ticketsHtml}
      <script>window.onload=()=>{window.print()}</script>
      </body></html>
    `)
    printWindow.document.close()
  }

  function toggleActivity(id: string) {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('tickets.title')}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. {t('tickets.fields.client')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('clients.search.placeholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedClient(null) }}
                className="pl-10"
              />
            </div>
            {searchResults && searchResults.length > 0 && !selectedClient && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => { setSelectedClient(c); setSearch(`${c.firstName} ${c.lastName}`) }}
                  >
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    <span className="text-gray-400 ml-2">{c.clientNumber}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{c.clientType}</Badge>
                  </button>
                ))}
              </div>
            )}
            {selectedClient && (
              <div className="p-3 bg-sky-50 rounded-md text-sm">
                <span className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</span>
                <span className="text-gray-500 ml-2">{selectedClient.clientNumber}</span>
              </div>
            )}

            {/* Gift option */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox checked={isGift} onCheckedChange={(v) => setIsGift(!!v)} />
              <Label className="text-sm flex items-center gap-1">
                <Gift className="h-4 w-4 text-amber-500" />
                {t('tickets.gift.title')}
              </Label>
            </div>
            {isGift && (
              <div className="space-y-2 pl-6">
                <Label className="text-xs">{t('tickets.gift.source')}</Label>
                <Input
                  placeholder="Rechercher l'abonné source..."
                  value={giftSourceSearch}
                  onChange={(e) => { setGiftSourceSearch(e.target.value); setGiftSource(null) }}
                  className="text-sm"
                />
                {giftSearchResults && giftSearchResults.length > 0 && !giftSource && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {giftSearchResults.map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
                        onClick={() => { setGiftSource(c); setGiftSourceSearch(`${c.firstName} ${c.lastName}`) }}
                      >
                        {c.firstName} {c.lastName} ({c.clientNumber})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. {t('tickets.fields.activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activities?.filter((a: any) => a.status === 'active').map((activity) => (
                <label key={activity.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={selectedActivities.includes(activity.id)}
                    onCheckedChange={() => toggleActivity(activity.id)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{activity.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {t(`activities.validityModes.${activity.ticketValidityMode}`)}
                    </span>
                  </div>
                  {activity.price > 0 && (
                    <span className="text-xs text-gray-500">{activity.price} DA</span>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate button */}
      <div className="flex gap-4">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!selectedClient || selectedActivities.length === 0 || generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Ticket className="mr-2 h-5 w-5" />
          )}
          {t('tickets.create')} ({selectedActivities.length})
        </Button>
        {generatedTickets.length > 0 && (
          <Button size="lg" variant="outline" onClick={printTickets}>
            <Printer className="mr-2 h-5 w-5" />
            {t('common.actions.print')} ({generatedTickets.length})
          </Button>
        )}
      </div>

      {/* Generated tickets preview */}
      {generatedTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {generatedTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 text-sm">
                  <div className="font-bold text-sky-600">{ticket.activityName}</div>
                  <div>{ticket.clientName}</div>
                  <div className="text-xs text-gray-400">N° {ticket.ticketNumber}</div>
                  {ticket.validUntil && (
                    <div className="text-xs text-gray-500 mt-1">
                      Expire : {new Date(ticket.validUntil).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                  {ticket.ticketType === 'cadeau' && (
                    <Badge className="bg-amber-100 text-amber-800 mt-1">{t('tickets.types.cadeau')}</Badge>
                  )}
                  {ticket.amount > 0 && <div className="text-xs mt-1">{ticket.amount} DA</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
