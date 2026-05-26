// Author: Dr Hamid MADANI drmdh@msn.com
import { auth } from '@/lib/auth'
import { Shield, Users, Ticket, ScanLine, DoorOpen, ConciergeBell } from 'lucide-react'
import { t } from '@/i18n'
import { clientRepo, scanLogRepo, lockerRepo } from '@/dal/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()

  const [cRepo, slRepo, lRepo] = await Promise.all([
    clientRepo(),
    scanLogRepo(),
    lockerRepo(),
  ])

  const activeSubscribers = await cRepo.countActiveSubscribers()
  const lockersOccupied = await lRepo.countOccupied()
  const lockersTotal = await lRepo.countTotal()
  const todayGranted = await slRepo.countGrantedToday()
  const visitorsPresent = await slRepo.findDistinctClientsToday()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500">{t('common.app.description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.metrics.visitorsPresent')}
            </CardTitle>
            <Users className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitorsPresent.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.metrics.activeSubscribers')}
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.metrics.todayUsages')}
            </CardTitle>
            <Ticket className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayGranted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.metrics.lockersOccupied')}
            </CardTitle>
            <DoorOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lockersOccupied} / {lockersTotal}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access shortcuts */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t('dashboard.shortcuts.title')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            href="/dashboard/reception"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:bg-indigo-50 transition-colors"
          >
            <ConciergeBell className="h-8 w-8 text-indigo-600" />
            <div>
              <div className="font-medium">{t('dashboard.shortcuts.reception')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.shortcuts.receptionDesc')}</div>
            </div>
          </Link>
          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:bg-sky-50 transition-colors"
          >
            <Ticket className="h-8 w-8 text-sky-600" />
            <div>
              <div className="font-medium">{t('dashboard.shortcuts.newTicket')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.shortcuts.newTicketDesc')}</div>
            </div>
          </Link>
          <Link
            href="/dashboard/scan"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:bg-sky-50 transition-colors"
          >
            <ScanLine className="h-8 w-8 text-green-600" />
            <div>
              <div className="font-medium">{t('dashboard.shortcuts.scan')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.shortcuts.scanDesc')}</div>
            </div>
          </Link>
          <Link
            href="/dashboard/clients/new"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:bg-sky-50 transition-colors"
          >
            <Users className="h-8 w-8 text-amber-600" />
            <div>
              <div className="font-medium">{t('dashboard.shortcuts.newClient')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.shortcuts.newClientDesc')}</div>
            </div>
          </Link>
          <Link
            href="/dashboard/lockers"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:bg-sky-50 transition-colors"
          >
            <DoorOpen className="h-8 w-8 text-purple-600" />
            <div>
              <div className="font-medium">{t('dashboard.shortcuts.lockers')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.shortcuts.lockersDesc')}</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
