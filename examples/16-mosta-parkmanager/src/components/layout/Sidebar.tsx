// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { t } from '@/i18n'
import {
  LayoutDashboard,
  Users,
  Activity,
  UserCheck,
  Ticket,
  ScanLine,
  DoorOpen,
  CreditCard,
  FileText,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ConciergeBell,
  Settings,
  Smartphone,
  Info,
  BookOpen,
  Zap,
  FolderCog,
  ShieldCheck,
  HelpCircle,
  Nfc,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useCallback } from 'react'

interface NavLeaf {
  type: 'leaf'
  label: string
  href: string
  icon: React.ElementType
  permission?: string
}

interface NavGroup {
  type: 'group'
  label: string
  icon: React.ElementType
  children: NavLeaf[]
}

type NavEntry = NavLeaf | NavGroup

const navTree: NavEntry[] = [
  { type: 'leaf', label: 'dashboard.title', href: '/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { type: 'leaf', label: 'reception.title', href: '/dashboard/reception', icon: ConciergeBell, permission: PERMISSIONS.TICKET_CREATE },
  { type: 'leaf', label: 'lockers.title', href: '/dashboard/lockers', icon: DoorOpen, permission: PERMISSIONS.LOCKER_VIEW },{ type: 'leaf', label: 'clients.title', href: '/dashboard/clients', icon: UserCheck, permission: PERMISSIONS.CLIENT_VIEW },
  { type: 'leaf', label: 'pwa.title', href: '/dashboard/pwa', icon: Smartphone, permission: PERMISSIONS.SCAN_VALIDATE },
   {
    type: 'group',
    label: 'Gestion',
    icon: FolderCog,
    children: [
      { type: 'leaf', label: 'activities.title', href: '/dashboard/activities', icon: Activity, permission: PERMISSIONS.ACTIVITY_VIEW },
      { type: 'leaf', label: 'access.plans.title', href: '/dashboard/plans', icon: CreditCard, permission: PERMISSIONS.ACCESS_VIEW },
      
  { type: 'leaf', label: 'rfid.title', href: '/dashboard/rfid', icon: Nfc, permission: PERMISSIONS.RFID_VIEW },
    ],
  },{
    type: 'group',
    label: 'Actions',
    icon: Zap,
    children: [
      { type: 'leaf', label: 'tickets.title', href: '/dashboard/tickets', icon: Ticket, permission: PERMISSIONS.TICKET_VIEW },
      { type: 'leaf', label: 'scan.title', href: '/dashboard/scan', icon: ScanLine, permission: PERMISSIONS.SCAN_VALIDATE },
    ],
  },
 
  {
    type: 'group',
    label: 'Administration',
    icon: ShieldCheck,
    children: [
      { type: 'leaf', label: 'users.title', href: '/dashboard/users', icon: Users, permission: PERMISSIONS.ADMIN_ACCESS },
      { type: 'leaf', label: 'roles.title', href: '/dashboard/roles', icon: Shield, permission: PERMISSIONS.ADMIN_ACCESS },
      { type: 'leaf', label: 'audit.title', href: '/dashboard/audit', icon: FileText, permission: PERMISSIONS.AUDIT_VIEW },
      { type: 'leaf', label: 'settings.title', href: '/dashboard/settings', icon: Settings, permission: PERMISSIONS.ADMIN_SETTINGS },
    ],
  },
  {
    type: 'group',
    label: 'Aide',
    icon: HelpCircle,
    children: [
      { type: 'leaf', label: 'guide.title', href: '/dashboard/guide', icon: BookOpen },
      { type: 'leaf', label: 'about.title', href: '/dashboard/about', icon: Info },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const userPermissions = (session?.user as any)?.permissions || []
  const userRole = (session?.user as any)?.role || ''

  const canSee = useCallback(
    (item: NavLeaf) => !item.permission || hasPermission(userPermissions, item.permission),
    [userPermissions]
  )

  const isActive = useCallback(
    (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href)),
    [pathname]
  )

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isGroupOpen = (group: NavGroup) => {
    // Explicitly toggled
    if (openGroups[group.label] !== undefined) return openGroups[group.label]
    // Auto-open if active child
    return group.children.some((child) => canSee(child) && isActive(child.href))
  }

  const renderLeaf = (item: NavLeaf, indent = false) => {
    if (!canSee(item)) return null
    const active = isActive(item.href)
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5',
          indent && !collapsed && 'pl-9',
          active
            ? 'bg-sky-50 text-sky-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
        title={collapsed ? t(item.label) : undefined}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        {!collapsed && <span>{t(item.label)}</span>}
      </Link>
    )
  }

  const renderGroup = (group: NavGroup) => {
    const visibleChildren = group.children.filter(canSee)
    if (visibleChildren.length === 0) return null

    const open = isGroupOpen(group)
    const hasActiveChild = visibleChildren.some((c) => isActive(c.href))
    const Icon = group.icon

    // Collapsed: show only icon of group, tooltip with label
    if (collapsed) {
      return (
        <div key={group.label} className="mb-0.5">
          <button
            onClick={() => toggleGroup(group.label)}
            className={cn(
              'flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              hasActiveChild ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
            title={group.label}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
          </button>
        </div>
      )
    }

    return (
      <div key={group.label} className="mb-0.5">
        <button
          onClick={() => toggleGroup(group.label)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
            hasActiveChild
              ? 'text-sky-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
              !open && '-rotate-90'
            )}
          />
        </button>
        {open && (
          <div className="mt-0.5">
            {visibleChildren.map((child) => renderLeaf(child, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-sky-600" />
            <span className="font-bold text-sky-900">{t('common.app.name')}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {navTree.map((entry) =>
          entry.type === 'leaf' ? renderLeaf(entry) : renderGroup(entry)
        )}
      </nav>

      <div className="border-t p-3">
        {!collapsed && session?.user && (
          <div className="mb-2 px-2 text-xs text-gray-500">
            <div className="font-medium text-gray-700">{session.user.name}</div>
            <div>{t(`auth.roles.${userRole}`)}</div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn('w-full text-red-600 hover:bg-red-50 hover:text-red-700', collapsed ? 'h-10 w-10' : '')}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t('auth.logout.button')}</span>}
        </Button>
      </div>
    </aside>
  )
}
