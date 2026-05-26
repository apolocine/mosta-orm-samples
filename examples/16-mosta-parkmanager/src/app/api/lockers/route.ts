// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { lockerRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const { error } = await checkPermission(PERMISSIONS.LOCKER_VIEW)
  if (error) return error

  const repo = await lockerRepo()
  const lockers = await repo.findAllWithOccupants()

  return NextResponse.json({ data: lockers })
}

export async function POST(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.LOCKER_MANAGE)
  if (error) return error

  const { number, zone, rfidLockId } = await req.json()

  const repo = await lockerRepo()
  const existing = await repo.findOne({ number })
  if (existing) {
    return NextResponse.json({ error: { code: 'DUPLICATE', message: 'Ce numéro existe déjà' } }, { status: 409 })
  }

  const locker = await repo.create({ number, zone, rfidLockId } as any)
  return NextResponse.json({ data: locker }, { status: 201 })
}
