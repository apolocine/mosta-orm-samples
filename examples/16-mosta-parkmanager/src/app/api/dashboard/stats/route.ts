// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server'
import { clientRepo, scanLogRepo, lockerRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.DASHBOARD_VIEW)
  if (error) return error

  const [cRepo, slRepo, lRepo] = await Promise.all([
    clientRepo(),
    scanLogRepo(),
    lockerRepo(),
  ])

  const [
    activeSubscribers,
    todayScans,
    lockersOccupied,
    lockersTotal,
    todayGranted,
    visitorsPresent,
  ] = await Promise.all([
    cRepo.countActiveSubscribers(),
    slRepo.countToday(),
    lRepo.countOccupied(),
    lRepo.countTotal(),
    slRepo.countGrantedToday(),
    slRepo.findDistinctClientsToday(),
  ])

  return NextResponse.json({
    data: {
      visitorsPresent: (visitorsPresent as unknown[]).length,
      activeSubscribers,
      todayUsages: todayGranted,
      lockersOccupied,
      lockersTotal,
      todayScans,
    },
  })
}
