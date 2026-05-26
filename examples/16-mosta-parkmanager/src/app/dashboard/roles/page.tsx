// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, Save, Shield, Database, AlertTriangle, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/i18n'

// ---- Types ----

interface RoleData {
  id: string
  name: string
  description?: string
  permissions: PermissionData[]
  userCount?: number
  _fallback?: boolean
}

interface PermissionData {
  id: string
  name: string
  description?: string
  category?: string
  roleCount?: number
  _fallback?: boolean
}

interface CategoryData {
  id: string
  name: string
  label: string
  description?: string
  icon?: string
  order: number
  system: boolean
  _fallback?: boolean
}

interface MatrixData {
  roles: { id: string; name: string; description: string }[]
  categories: Record<string, { id: string; name: string; description: string }[]>
  categoryLabels: Record<string, string>
  matrix: Record<string, Record<string, boolean>>
}

// ---- API helpers ----

async function fetchRoles(): Promise<RoleData[]> {
  const res = await fetch('/api/admin/roles')
  if (!res.ok) throw new Error('Erreur chargement roles')
  return (await res.json()).data
}

async function fetchPermissions(): Promise<{ data: PermissionData[]; categories: Record<string, string> }> {
  const res = await fetch('/api/admin/permissions')
  if (!res.ok) throw new Error('Erreur chargement permissions')
  return res.json()
}

async function fetchMatrix(): Promise<MatrixData> {
  const res = await fetch('/api/admin/permissions/matrix')
  if (!res.ok) throw new Error('Erreur chargement matrice')
  return (await res.json()).data
}

async function fetchCategories(): Promise<CategoryData[]> {
  const res = await fetch('/api/admin/categories')
  if (!res.ok) throw new Error('Erreur chargement categories')
  return (await res.json()).data
}

async function seedRbac(): Promise<any> {
  const res = await fetch('/api/admin/permissions/seed', { method: 'POST' })
  if (!res.ok) throw new Error('Erreur initialisation RBAC')
  return (await res.json()).data
}

async function saveMatrixChanges(changes: { roleId: string; permissionId: string; granted: boolean }[]) {
  const res = await fetch('/api/admin/permissions/matrix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes }),
  })
  if (!res.ok) throw new Error('Erreur sauvegarde matrice')
  return (await res.json()).data
}

async function createRole(data: { name: string; description: string }) {
  const res = await fetch('/api/admin/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur creation role')
  }
  return (await res.json()).data
}

async function updateRole(id: string, data: { name?: string; description?: string }) {
  const res = await fetch(`/api/admin/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur modification role')
  }
  return (await res.json()).data
}

async function deleteRoleApi(id: string) {
  const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur suppression role')
  }
}

async function createPermission(data: { name: string; description: string; category: string }) {
  const res = await fetch('/api/admin/permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur creation permission')
  }
  return (await res.json()).data
}

async function updatePermission(id: string, data: { description?: string; category?: string }) {
  const res = await fetch(`/api/admin/permissions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur modification permission')
  }
  return (await res.json()).data
}

async function deletePermissionApi(id: string) {
  const res = await fetch(`/api/admin/permissions/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur suppression permission')
  }
}

async function createCategoryApi(data: { name: string; label: string; description: string; icon: string; order: number }) {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur creation categorie')
  }
  return (await res.json()).data
}

async function updateCategoryApi(id: string, data: { label?: string; description?: string; icon?: string; order?: number }) {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur modification categorie')
  }
  return (await res.json()).data
}

async function deleteCategoryApi(id: string) {
  const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erreur suppression categorie')
  }
}

const SYSTEM_ROLES = ['admin', 'agent_accueil', 'agent_attraction', 'superviseur']

// ==================================================
// Main Page Component
// ==================================================

export default function RolesPage() {
  const [tab, setTab] = useState('matrix')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-sky-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('roles.title')}</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="matrix">{t('roles.tabs.matrix')}</TabsTrigger>
          <TabsTrigger value="roles">{t('roles.tabs.roles')}</TabsTrigger>
          <TabsTrigger value="permissions">{t('roles.tabs.permissions')}</TabsTrigger>
          <TabsTrigger value="categories">{t('roles.tabs.categories')}</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <MatrixTab />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
        <TabsContent value="permissions">
          <PermissionsTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================================================
// Matrix Tab (Drupal-style)
// ==================================================

function MatrixTab() {
  const queryClient = useQueryClient()
  const { data: matrix, isLoading } = useQuery({ queryKey: ['matrix'], queryFn: fetchMatrix })
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({})

  const pendingCount = Object.values(pendingChanges).reduce(
    (acc, perms) => acc + Object.keys(perms).length, 0
  )

  const seedMutation = useMutation({
    mutationFn: seedRbac,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('roles.matrix.initialized'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const changes: { roleId: string; permissionId: string; granted: boolean }[] = []
      for (const [roleId, perms] of Object.entries(pendingChanges)) {
        for (const [permId, granted] of Object.entries(perms)) {
          changes.push({ roleId, permissionId: permId, granted })
        }
      }
      return saveMatrixChanges(changes)
    },
    onSuccess: () => {
      setPendingChanges({})
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('roles.matrix.saved'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleCell = useCallback((roleId: string, permId: string, currentValue: boolean) => {
    setPendingChanges((prev) => {
      const copy = { ...prev }
      if (!copy[roleId]) copy[roleId] = {}

      // If toggling back to original value, remove the pending change
      const newValue = !currentValue
      copy[roleId] = { ...copy[roleId], [permId]: newValue }

      return copy
    })
  }, [])

  const getCellValue = useCallback((roleId: string, permId: string): boolean => {
    if (pendingChanges[roleId]?.[permId] !== undefined) {
      return pendingChanges[roleId][permId]
    }
    return matrix?.matrix[roleId]?.[permId] || false
  }, [pendingChanges, matrix])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // No data — show init button
  if (!matrix || Object.keys(matrix.categories).length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Database className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{t('roles.matrix.noData')}</p>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Database className="mr-2 h-4 w-4" />
            {t('roles.matrix.initRbac')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const categoryLabels = matrix.categoryLabels || {}

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {pendingCount} {t('roles.matrix.pending')}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            size="sm"
          >
            {seedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            {t('roles.matrix.initRbac')}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={pendingCount === 0 || saveMutation.isPending}
            size="sm"
          >
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('roles.matrix.save')}
          </Button>
        </div>
      </div>

      {/* Matrix table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10 min-w-[250px]">Permission</TableHead>
                {matrix.roles.map((role) => (
                  <TableHead key={role.id} className="text-center min-w-[120px]">
                    <div className="font-medium">{role.name}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(matrix.categories).map(([category, perms]) => (
                <Fragment key={category}>
                  {/* Category header row */}
                  <TableRow className="bg-gray-50">
                    <TableCell
                      colSpan={matrix.roles.length + 1}
                      className="font-semibold text-gray-700 py-2"
                    >
                      {categoryLabels[category] || category}
                    </TableCell>
                  </TableRow>
                  {/* Permission rows */}
                  {perms.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="sticky left-0 bg-white z-10">
                        <div>
                          <span className="font-mono text-sm">{perm.name}</span>
                          {perm.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                          )}
                        </div>
                      </TableCell>
                      {matrix.roles.map((role) => {
                        const checked = getCellValue(role.id, perm.id)
                        const isPending = pendingChanges[role.id]?.[perm.id] !== undefined
                        return (
                          <TableCell key={`${role.id}-${perm.id}`} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() =>
                                  toggleCell(role.id, perm.id, getCellValue(role.id, perm.id))
                                }
                                className={isPending ? 'ring-2 ring-amber-400' : ''}
                              />
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================================================
// Roles Tab
// ==================================================

function RolesTab() {
  const queryClient = useQueryClient()
  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleData | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const createMut = useMutation({
    mutationFn: () => createRole(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      resetForm()
      toast.success(t('roles.roles.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: () => updateRole(editingRole!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      setEditingRole(null)
      resetForm()
      toast.success(t('roles.roles.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      toast.success(t('roles.roles.deleted'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ name: '', description: '' })
  }

  function openCreate() {
    resetForm()
    setEditingRole(null)
    setDialogOpen(true)
  }

  function openEdit(role: RoleData) {
    setEditingRole(role)
    setForm({ name: role.name, description: role.description || '' })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingRole) {
      updateMut.mutate()
    } else {
      createMut.mutate()
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roles.roles.create')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('roles.roles.name')}</TableHead>
                  <TableHead>{t('roles.roles.description')}</TableHead>
                  <TableHead className="text-center">{t('roles.roles.permissions')}</TableHead>
                  <TableHead className="text-center">{t('roles.roles.users')}</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => {
                  const isSystem = SYSTEM_ROLES.includes(role.name)
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium font-mono">{role.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{role.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{role.permissions?.length || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={role.userCount ? 'bg-blue-100 text-blue-800' : ''}>
                          {role.userCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isSystem ? (
                          <Badge className="bg-amber-100 text-amber-800">{t('roles.roles.system')}</Badge>
                        ) : (
                          <Badge variant="secondary">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(role)}
                            className="h-8 w-8"
                            disabled={role._fallback}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (isSystem) {
                                toast.error(t('roles.roles.cannotDeleteSystem'))
                                return
                              }
                              if ((role.userCount || 0) > 0) {
                                toast.error(t('roles.roles.cannotDeleteUsersAssigned'))
                                return
                              }
                              if (confirm(t('roles.roles.confirmDelete'))) {
                                deleteMut.mutate(role.id)
                              }
                            }}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            disabled={role._fallback || isSystem}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {(!roles || roles.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      {t('roles.roles.noRoles')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? t('roles.roles.edit') : t('roles.roles.create')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('roles.roles.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('roles.roles.namePlaceholder')}
                required
                disabled={!!editingRole && SYSTEM_ROLES.includes(editingRole.name)}
                pattern="^[a-z][a-z0-9_]*$"
                title="Minuscules, chiffres et underscores uniquement"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.roles.description')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('roles.roles.descriptionPlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.actions.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================================================
// Permissions Tab
// ==================================================

function PermissionsTab() {
  const queryClient = useQueryClient()
  const { data: permData, isLoading } = useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })
  const { data: categoriesList } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const permissions = permData?.data || []
  const categoryLabels = permData?.categories || {}
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPerm, setEditingPerm] = useState<PermissionData | null>(null)
  const [form, setForm] = useState({ name: '', description: '', category: '' })

  const createMut = useMutation({
    mutationFn: () => createPermission(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      resetForm()
      toast.success(t('roles.permissions.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: () => updatePermission(editingPerm!.id, { description: form.description, category: form.category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      setEditingPerm(null)
      resetForm()
      toast.success(t('roles.permissions.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: deletePermissionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('roles.permissions.deleted'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ name: '', description: '', category: '' })
  }

  function openCreate() {
    resetForm()
    setEditingPerm(null)
    setDialogOpen(true)
  }

  function openEdit(perm: PermissionData) {
    setEditingPerm(perm)
    setForm({ name: perm.name, description: perm.description || '', category: perm.category || '' })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingPerm) {
      updateMut.mutate()
    } else {
      createMut.mutate()
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roles.permissions.create')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('roles.permissions.name')}</TableHead>
                  <TableHead>{t('roles.permissions.description')}</TableHead>
                  <TableHead>{t('roles.permissions.category')}</TableHead>
                  <TableHead className="text-center">{t('roles.permissions.rolesUsing')}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell className="font-medium font-mono text-sm">{perm.name}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{perm.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[perm.category || ''] || perm.category || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{perm.roleCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(perm)}
                          className="h-8 w-8"
                          disabled={perm._fallback}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const msg = (perm.roleCount || 0) > 0
                              ? `${t('roles.permissions.confirmDelete')}\n\n${t('roles.permissions.warningRolesUsing')}`
                              : t('roles.permissions.confirmDelete')
                            if (confirm(msg)) {
                              deleteMut.mutate(perm.id)
                            }
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={perm._fallback}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {permissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      {t('roles.permissions.noPermissions')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPerm ? t('roles.permissions.edit') : t('roles.permissions.create')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('roles.permissions.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('roles.permissions.namePlaceholder')}
                required
                disabled={!!editingPerm}
                pattern="^[a-z_]+:[a-z_]+$"
                title="Format requis : categorie:action (ex: caisse:view)"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.permissions.description')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('roles.permissions.descriptionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.permissions.category')}</Label>
              <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('roles.permissions.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesList || []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.actions.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================================================
// Categories Tab
// ==================================================

function CategoriesTab() {
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: permData } = useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<CategoryData | null>(null)
  const [form, setForm] = useState({ name: '', label: '', description: '', icon: '', order: 0 })

  // Count permissions per category
  const permCountByCategory: Record<string, number> = {}
  if (permData?.data) {
    for (const p of permData.data) {
      const cat = p.category || 'other'
      permCountByCategory[cat] = (permCountByCategory[cat] || 0) + 1
    }
  }

  const createMut = useMutation({
    mutationFn: () => createCategoryApi(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      resetForm()
      toast.success(t('roles.categories.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: () => updateCategoryApi(editingCat!.id, {
      label: form.label,
      description: form.description,
      icon: form.icon,
      order: form.order,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      setEditingCat(null)
      resetForm()
      toast.success(t('roles.categories.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: deleteCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('roles.categories.deleted'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ name: '', label: '', description: '', icon: '', order: 0 })
  }

  function openCreate() {
    resetForm()
    setEditingCat(null)
    setDialogOpen(true)
  }

  function openEdit(cat: CategoryData) {
    setEditingCat(cat)
    setForm({
      name: cat.name,
      label: cat.label,
      description: cat.description || '',
      icon: cat.icon || '',
      order: cat.order,
    })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingCat) {
      updateMut.mutate()
    } else {
      createMut.mutate()
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roles.categories.create')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('roles.categories.name')}</TableHead>
                  <TableHead>{t('roles.categories.label')}</TableHead>
                  <TableHead>{t('roles.categories.description')}</TableHead>
                  <TableHead className="text-center">{t('roles.categories.order')}</TableHead>
                  <TableHead className="text-center">{t('roles.categories.permissions')}</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium font-mono text-sm">{cat.name}</TableCell>
                    <TableCell>{cat.label}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{cat.description || '-'}</TableCell>
                    <TableCell className="text-center">{cat.order}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{permCountByCategory[cat.name] || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {cat.system ? (
                        <Badge className="bg-amber-100 text-amber-800">{t('roles.categories.system')}</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                          className="h-8 w-8"
                          disabled={cat._fallback}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (cat.system) {
                              toast.error(t('roles.categories.cannotDeleteSystem'))
                              return
                            }
                            if ((permCountByCategory[cat.name] || 0) > 0) {
                              toast.error(t('roles.categories.cannotDeletePermissionsUsing'))
                              return
                            }
                            if (confirm(t('roles.categories.confirmDelete'))) {
                              deleteMut.mutate(cat.id)
                            }
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={cat._fallback || cat.system}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!categories || categories.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      {t('roles.categories.noCategories')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? t('roles.categories.edit') : t('roles.categories.create')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('roles.categories.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('roles.categories.namePlaceholder')}
                required
                disabled={!!editingCat}
                pattern="^[a-z][a-z0-9_]*$"
                title="Minuscules, chiffres et underscores uniquement"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.categories.label')}</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder={t('roles.categories.labelPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.categories.description')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('roles.categories.icon')}</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="ex: UserCheck"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('roles.categories.order')}</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.actions.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
