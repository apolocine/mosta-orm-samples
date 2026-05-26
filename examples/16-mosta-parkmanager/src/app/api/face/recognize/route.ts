// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { getSettings } from '@/lib/settings'
import { z } from 'zod'

const recognizeSchema = z.object({
  faceDescriptor: z.array(z.number()).length(128),
})

/**
 * POST /api/face/recognize
 * Reçoit un descripteur facial (128 floats), cherche le meilleur match en base.
 */
export async function POST(req: NextRequest) {
  const settings = await getSettings()

  // Vérifier que la feature est activée
  if (!settings.faceRecognitionEnabled) {
    return NextResponse.json(
      { error: { code: 'FEATURE_DISABLED', message: 'La reconnaissance faciale est désactivée' } },
      { status: 403 }
    )
  }

  const { error } = await checkPermission(PERMISSIONS.CLIENT_SEARCH)
  if (error) return error

  const body = await req.json()
  const parsed = recognizeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Descripteur facial invalide (attendu: 128 nombres)', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { faceDescriptor } = parsed.data

  // Charger tous les clients qui ont un descripteur facial
  const cRepo = await clientRepo()
  const clients = await cRepo.findAll(
    { faceDescriptor: { $exists: true, $not: { $size: 0 } }, status: 'active' },
    { select: ['firstName', 'lastName', 'clientNumber', 'photo', 'faceDescriptor'] },
  )

  if (clients.length === 0) {
    return NextResponse.json({
      data: { match: false, message: 'Aucun client avec données faciales en base' },
    })
  }

  // Calcul euclidien côté serveur
  let bestClient: any = null
  let bestDistance = Infinity

  for (const client of clients) {
    const desc = (client as any).faceDescriptor
    if (!desc || desc.length !== 128) continue

    let sum = 0
    for (let i = 0; i < 128; i++) {
      const diff = faceDescriptor[i] - desc[i]
      sum += diff * diff
    }
    const distance = Math.sqrt(sum)

    if (distance < bestDistance) {
      bestDistance = distance
      bestClient = client
    }
  }

  const threshold = settings.faceRecognitionThreshold

  if (bestClient && bestDistance < threshold) {
    return NextResponse.json({
      data: {
        match: true,
        distance: Math.round(bestDistance * 1000) / 1000,
        client: {
          id: bestClient.id,
          firstName: bestClient.firstName,
          lastName: bestClient.lastName,
          clientNumber: bestClient.clientNumber,
          photo: bestClient.photo,
        },
      },
    })
  }

  return NextResponse.json({
    data: {
      match: false,
      distance: bestClient ? Math.round(bestDistance * 1000) / 1000 : null,
    },
  })
}
