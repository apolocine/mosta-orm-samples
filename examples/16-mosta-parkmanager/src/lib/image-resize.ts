// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Resize une image base64 à une taille raisonnable avant stockage en DB.
// Objectif : économiser DB, bande passante et perf UI sur les listings.
//
// Cible : 400×400 JPEG quality 0.85 ≈ 30-50 KB en base64 — suffisant pour
// affichage avatar 32×32 jusqu'à photo détail 160×160 avec densité rétina.

/**
 * Redimensionne une image base64 (data URL) à `maxWidth` × `maxHeight` max,
 * en préservant l'aspect ratio, et la ré-encode en JPEG avec `quality`.
 *
 * @param base64       Data URL d'origine (`data:image/...;base64,...`)
 * @param maxWidth     Largeur max (défaut 400)
 * @param maxHeight    Hauteur max (défaut 400)
 * @param quality      Qualité JPEG 0-1 (défaut 0.85)
 * @returns            Promise<data URL JPEG redimensionné>
 *
 * Si l'image est déjà plus petite que maxWidth × maxHeight, elle est
 * tout de même ré-encodée en JPEG pour normaliser la taille.
 */
export async function resizeBase64(
  base64: string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85,
): Promise<string> {
  if (!base64 || !base64.startsWith('data:image/')) {
    return base64
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calcul du ratio en préservant l'aspect ratio
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context indisponible'))
        return
      }
      // Lisser le redimensionnement (utile pour les photos d'identité)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Image invalide ou corrompue'))
    img.src = base64
  })
}

/**
 * Estimation rapide de la taille (en KB) d'une data URL base64, sans la décoder.
 * Utile pour logger l'économie de place après resize.
 */
export function dataUrlSizeKB(dataUrl: string): number {
  if (!dataUrl) return 0
  const payload = dataUrl.split(',')[1] || ''
  // base64 → 3/4 = ratio bytes par char
  const bytes = (payload.length * 3) / 4
  return Math.round(bytes / 1024)
}
