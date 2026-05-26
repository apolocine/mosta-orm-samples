// Author: Dr Hamid MADANI drmdh@msn.com
import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/authCheck'
import { PERMISSIONS } from '@/lib/permissions'
import { getSettings } from '@/lib/settings'

/**
 * POST /api/face/detect
 * Endpoint placeholder pour usage serveur futur.
 * La détection et l'extraction se font côté client via face-api.js.
 */
export async function POST(req: NextRequest) {
  const settings = await getSettings()
  if (!settings.faceRecognitionEnabled) {
    return NextResponse.json(
      { error: { code: 'FEATURE_DISABLED', message: 'La reconnaissance faciale est désactivée' } },
      { status: 403 }
    )
  }

  const { error } = await checkPermission(PERMISSIONS.CLIENT_VIEW)
  if (error) return error

  return NextResponse.json({
    data: {
      message: 'La détection faciale se fait côté client. Utilisez le composant FaceDetector.',
      hint: 'Pour la reconnaissance, envoyez le descripteur à POST /api/face/recognize',
    },
  })
}
