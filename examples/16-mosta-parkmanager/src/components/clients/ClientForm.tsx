// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/i18n'
import FaceDetector from '@/components/clients/FaceDetector'
import { resizeBase64, dataUrlSizeKB } from '@/lib/image-resize'

interface ClientFormProps {
  initialData?: any
  isEditing?: boolean
}

export default function ClientForm({ initialData, isEditing }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    clientType: initialData?.clientType || 'visiteur',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
    gender: initialData?.gender || '',
    photo: initialData?.photo || '',
    faceDescriptor: initialData?.faceDescriptor || null as number[] | null,
    address: initialData?.address || '',
    wilaya: initialData?.wilaya || '',
    notes: initialData?.notes || '',
  })

  const handleFaceCapture = useCallback(async (data: { photo: string; faceDescriptor: number[] | null }) => {
    // Resize la photo à 400×400 JPEG q=0.85 avant stockage — économie DB + bande passante.
    // L'affichage cible va de avatar 32×32 (listing) à photo détail 160×160 (rétina ×2 OK).
    try {
      const before = dataUrlSizeKB(data.photo)
      const resized = await resizeBase64(data.photo, 400, 400, 0.85)
      const after = dataUrlSizeKB(resized)
      if (before > after) {
        console.log(`[photo] redimensionnée ${before} KB → ${after} KB (-${Math.round((1 - after / before) * 100)}%)`)
      }
      setForm((prev) => ({ ...prev, photo: resized, faceDescriptor: data.faceDescriptor }))
    } catch (err) {
      // Fallback : photo originale si resize échoue (canvas indisponible, etc.)
      console.warn('[photo] resize impossible, on garde l\'original :', err)
      setForm((prev) => ({ ...prev, photo: data.photo, faceDescriptor: data.faceDescriptor }))
    }
  }, [])

  const handlePhotoClear = useCallback(() => {
    setForm((prev) => ({ ...prev, photo: '', faceDescriptor: null }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = isEditing ? `/api/clients/${initialData.id}` : '/api/clients'
    const method = isEditing ? 'PUT' : 'POST'

    try {
      // Préparer les données (exclure faceDescriptor si null)
      const submitData: any = { ...form }
      if (!submitData.faceDescriptor) {
        delete submitData.faceDescriptor
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Erreur')
      }

      const data = await res.json()
      toast.success(isEditing ? 'Client modifié' : 'Client créé')
      router.push(`/dashboard/clients/${data.data.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('clients.fields.clientType')}</Label>
                <Select value={form.clientType} onValueChange={(v) => setForm({ ...form, clientType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abonne">{t('clients.types.abonne')}</SelectItem>
                    <SelectItem value="visiteur">{t('clients.types.visiteur')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('clients.fields.firstName')}</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('clients.fields.lastName')}</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('clients.fields.phone')}</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('clients.fields.email')}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('clients.fields.dateOfBirth')}</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('clients.fields.gender')}</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Homme</SelectItem>
                      <SelectItem value="female">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('clients.fields.address')}</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('clients.fields.wilaya')}</Label>
                  <Input value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('clients.fields.notes')}</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('clients.fields.photo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <FaceDetector
                photo={form.photo}
                onCapture={handleFaceCapture}
                onClear={handlePhotoClear}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t('common.actions.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('common.actions.save')}
        </Button>
      </div>
    </form>
  )
}
