// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, X, Pencil, Loader2, Ticket, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/i18n'

interface AccessRecord {
  id: string
  accessType: string
  totalQuota: number | null
  remainingQuota: number | null
  endDate: string | null
  status: string
  ticketCount: number
  scanCount: number
  activity?: { id: string; name: string }
}

interface ActivityRecord {
  id: string
  name: string
  color?: string
}

interface PlanRecord {
  id: string
  name: string
  price: number
}

interface AccessGridProps {
  clientId: string
}

export default function AccessGrid({ clientId }: AccessGridProps) {
  const queryClient = useQueryClient()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<'plan' | 'manual'>('plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [manualForm, setManualForm] = useState({
    activityId: '',
    accessType: 'count',
    totalQuota: '',
    durationDays: '',
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editAccess, setEditAccess] = useState<AccessRecord | null>(null)
  const [editForm, setEditForm] = useState({
    accessType: '',
    totalQuota: '',
    durationDays: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['clientAccess', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/access`)
      if (!res.ok) throw new Error('Erreur')
      return (await res.json()).data
    },
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch('/api/subscription-plans')
      if (!res.ok) throw new Error('Erreur')
      return (await res.json()).data
    },
  })

  const assignMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/clients/${clientId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientAccess', clientId] })
      setAssignDialogOpen(false)
      toast.success('Accès attribué')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const editMutation = useMutation({
    mutationFn: async ({ accessId, body }: { accessId: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/clients/${clientId}/access/${accessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientAccess', clientId] })
      setEditDialogOpen(false)
      setEditAccess(null)
      toast.success('Accès modifié')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const revokeMutation = useMutation({
    mutationFn: async (accessId: string) => {
      const res = await fetch(`/api/clients/${clientId}/access/${accessId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientAccess', clientId] })
      toast.success('Accès révoqué')
    },
  })

  function openEdit(access: AccessRecord) {
    setEditAccess(access)
    const remainingDays = access.endDate
      ? Math.max(0, Math.ceil((new Date(access.endDate).getTime() - Date.now()) / 86400000))
      : ''
    setEditForm({
      accessType: access.accessType,
      totalQuota: access.totalQuota != null ? String(access.totalQuota) : '',
      durationDays: remainingDays ? String(remainingDays) : '',
    })
    setEditDialogOpen(true)
  }

  function handleEdit() {
    if (!editAccess) return
    const body: Record<string, unknown> = { accessType: editForm.accessType }
    if (editForm.accessType === 'count' || editForm.accessType === 'mixed') {
      const newTotal = editForm.totalQuota ? Number(editForm.totalQuota) : null
      // Consommé = scanCount (tickets validés par agent), restant = nouveau total - consommé
      const consumed = editAccess.scanCount || 0
      body.totalQuota = newTotal
      body.remainingQuota = newTotal != null ? Math.max(0, newTotal - consumed) : null
    }
    if (editForm.accessType === 'temporal' || editForm.accessType === 'mixed') {
      body.endDate = editForm.durationDays
        ? new Date(Date.now() + Number(editForm.durationDays) * 86400000).toISOString()
        : null
    }
    if (editForm.accessType === 'unlimited') {
      body.totalQuota = null
      body.remainingQuota = null
      body.endDate = null
    }
    editMutation.mutate({ accessId: editAccess.id, body })
  }

  function handleAssign() {
    if (assignMode === 'plan') {
      assignMutation.mutate({ planId: selectedPlan })
    } else {
      assignMutation.mutate({
        activityId: manualForm.activityId,
        accessType: manualForm.accessType,
        totalQuota: manualForm.totalQuota ? Number(manualForm.totalQuota) : null,
        durationDays: manualForm.durationDays ? Number(manualForm.durationDays) : null,
      })
    }
  }

  const accesses: AccessRecord[] = data?.accesses || []
  const activities: ActivityRecord[] = data?.activities || []

  const accessMap = new Map<string, AccessRecord>(
    accesses.map((a) => [a.activity?.id ?? '', a])
  )

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    blocked: 'bg-gray-100 text-gray-800',
    depleted: 'bg-orange-100 text-orange-800',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('access.grid.title')}</CardTitle>
        <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t('access.grid.assign')}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('access.fields.activity')}</TableHead>
                <TableHead>{t('access.fields.accessType')}</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Restant</TableHead>
                <TableHead>Imprimés</TableHead>
                <TableHead>Validés</TableHead>
                <TableHead>{t('access.fields.status')}</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => {
                const access = accessMap.get(activity.id)
                return (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {activity.color && (
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: activity.color }} />
                        )}
                        <span className="font-medium">{activity.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {access ? (
                        <Badge variant="outline">{t(`access.types.${access.accessType}`)}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {access?.totalQuota != null ? access.totalQuota : access ? '∞' : '—'}
                    </TableCell>
                    <TableCell>
                      {access?.remainingQuota != null ? access.remainingQuota :
                        access?.endDate ? `${Math.max(0, Math.ceil((new Date(access.endDate).getTime() - Date.now()) / 86400000))} j` :
                        access ? '∞' : '—'}
                    </TableCell>
                    <TableCell>
                      {access ? (
                        <div className="flex items-center gap-1">
                          <Ticket className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium">{access.ticketCount || 0}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {access ? (
                        <div className="flex items-center gap-1">
                          <ScanLine className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium">{access.scanCount || 0}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {access ? (
                        <Badge className={statusColors[access.status] || ''} variant="secondary">
                          {t(`common.status.${access.status}`)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">{t('access.grid.noAccess')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {access && access.status === 'active' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(access)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => revokeMutation.mutate(access.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('access.grid.assign')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={assignMode === 'plan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignMode('plan')}
              >
                Via plan
              </Button>
              <Button
                variant={assignMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignMode('manual')}
              >
                Manuel
              </Button>
            </div>

            {assignMode === 'plan' ? (
              <div className="space-y-2">
                <Label>Plan d'abonnement</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un plan" /></SelectTrigger>
                  <SelectContent>
                    {(plans as PlanRecord[] | undefined)?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.price} DA)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t('access.fields.activity')}</Label>
                  <Select value={manualForm.activityId} onValueChange={(v) => setManualForm({ ...manualForm, activityId: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {activities?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('access.fields.accessType')}</Label>
                  <Select value={manualForm.accessType} onValueChange={(v) => setManualForm({ ...manualForm, accessType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">{t('access.types.unlimited')}</SelectItem>
                      <SelectItem value="count">{t('access.types.count')}</SelectItem>
                      <SelectItem value="temporal">{t('access.types.temporal')}</SelectItem>
                      <SelectItem value="mixed">{t('access.types.mixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(manualForm.accessType === 'count' || manualForm.accessType === 'mixed') && (
                  <div className="space-y-2">
                    <Label>Nombre de sessions</Label>
                    <Input type="number" value={manualForm.totalQuota} onChange={(e) => setManualForm({ ...manualForm, totalQuota: e.target.value })} min={1} />
                  </div>
                )}
                {(manualForm.accessType === 'temporal' || manualForm.accessType === 'mixed') && (
                  <div className="space-y-2">
                    <Label>Durée (jours)</Label>
                    <Input type="number" value={manualForm.durationDays} onChange={(e) => setManualForm({ ...manualForm, durationDays: e.target.value })} min={1} />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button onClick={handleAssign} disabled={assignMutation.isPending}>
                {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('access.grid.assign')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'accès — {editAccess?.activity?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('access.fields.accessType')}</Label>
              <Select value={editForm.accessType} onValueChange={(v) => setEditForm({ ...editForm, accessType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">{t('access.types.unlimited')}</SelectItem>
                  <SelectItem value="count">{t('access.types.count')}</SelectItem>
                  <SelectItem value="temporal">{t('access.types.temporal')}</SelectItem>
                  <SelectItem value="mixed">{t('access.types.mixed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(editForm.accessType === 'count' || editForm.accessType === 'mixed') && (
              <>
                <div className="space-y-2">
                  <Label>Quota total</Label>
                  <Input type="number" value={editForm.totalQuota} onChange={(e) => setEditForm({ ...editForm, totalQuota: e.target.value })} min={1} />
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Validés : <strong className="text-gray-900">{editAccess?.scanCount || 0}</strong></span>
                  <span>Restant : <strong className="text-gray-900">
                    {editForm.totalQuota ? Math.max(0, Number(editForm.totalQuota) - (editAccess?.scanCount || 0)) : '—'}
                  </strong></span>
                </div>
              </>
            )}
            {(editForm.accessType === 'temporal' || editForm.accessType === 'mixed') && (
              <div className="space-y-2">
                <Label>Durée restante (jours)</Label>
                <Input type="number" value={editForm.durationDays} onChange={(e) => setEditForm({ ...editForm, durationDays: e.target.value })} min={1} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button onClick={handleEdit} disabled={editMutation.isPending}>
                {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.actions.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
