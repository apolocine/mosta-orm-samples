// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const { error } = await checkPermission(PERMISSIONS.CLIENT_SEARCH)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const repo = await clientRepo()
  const clients = await repo.findAll(
    {
      $or: [
        { firstName: { $regex: q, $regexFlags: 'i' } },
        { lastName: { $regex: q, $regexFlags: 'i' } },
        { phone: { $regex: q, $regexFlags: 'i' } },
        { clientNumber: { $regex: q, $regexFlags: 'i' } },
      ],
      status: 'active',
    },
    {
      select: ['clientNumber', 'firstName', 'lastName', 'phone', 'clientType', 'photo'],
      limit: 10,
    },
  )

  return NextResponse.json({ data: clients })
}
