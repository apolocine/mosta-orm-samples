// Author: Dr Hamid MADANI drmdh@msn.com
/**
 * Service utilitaire face-api.js — CLIENT-SIDE uniquement
 *
 * Utiliser via dynamic import dans useEffect pour éviter SSR :
 *   const faceApi = await import('@/lib/faceApi')
 */

let fapi: typeof import('@vladmandic/face-api') | null = null
let modelsLoaded = false

/**
 * Charge la lib face-api et les 3 modèles (TinyFaceDetector, landmarks68, recognition)
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return

  fapi = await import('@vladmandic/face-api')

  const MODEL_URL = '/models/face-api'

  await Promise.all([
    fapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    fapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    fapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])

  modelsLoaded = true
}

/**
 * Détecte un visage dans un élément vidéo ou canvas.
 * Retourne la détection avec landmarks et bounding box, ou null si aucun visage.
 */
export async function detectFace(
  input: HTMLVideoElement | HTMLCanvasElement
) {
  if (!fapi) throw new Error('face-api non chargé — appeler loadModels() d\'abord')

  const detection = await fapi
    .detectSingleFace(input, new fapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()

  return detection || null
}

/**
 * Extrait le descripteur facial (Float32Array[128]) d'un élément vidéo ou canvas.
 * Retourne null si aucun visage détecté.
 */
export async function extractDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  if (!fapi) throw new Error('face-api non chargé — appeler loadModels() d\'abord')

  const result = await fapi
    .detectSingleFace(input, new fapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  return result?.descriptor || null
}

/**
 * Calcule la distance euclidienne entre deux descripteurs faciaux.
 */
export function compareFaces(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): number {
  const a = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1)
  const b = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2)

  if (a.length !== 128 || b.length !== 128) {
    throw new Error('Les descripteurs doivent faire 128 éléments')
  }

  let sum = 0
  for (let i = 0; i < 128; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Cherche le meilleur match parmi une liste de candidats.
 * Retourne le candidat le plus proche et la distance, ou null si aucun match sous le seuil.
 */
export function findMatch<T extends { faceDescriptor: number[] }>(
  descriptor: Float32Array | number[],
  candidates: T[],
  threshold?: number
): { match: T; distance: number } | null {
  const maxDistance = threshold ?? 0.6

  let bestMatch: T | null = null
  let bestDistance = Infinity

  for (const candidate of candidates) {
    if (!candidate.faceDescriptor || candidate.faceDescriptor.length !== 128) continue
    const distance = compareFaces(descriptor, candidate.faceDescriptor)
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = candidate
    }
  }

  if (bestMatch && bestDistance < maxDistance) {
    return { match: bestMatch, distance: bestDistance }
  }

  return null
}

/**
 * Dessine la bounding box de détection sur un canvas overlay.
 */
export function drawDetection(
  canvas: HTMLCanvasElement,
  detection: Awaited<ReturnType<typeof detectFace>>,
  videoWidth: number,
  videoHeight: number
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = videoWidth
  canvas.height = videoHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!detection) return

  const box = detection.detection.box
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 3
  ctx.strokeRect(box.x, box.y, box.width, box.height)

  // Label avec score
  const score = Math.round(detection.detection.score * 100)
  ctx.fillStyle = '#22c55e'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText(`Visage ${score}%`, box.x, box.y - 6)
}
