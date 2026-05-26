// Author: Dr Hamid MADANI drmdh@msn.com
/**
 * Configuration centralisée des fonctionnalités (feature flags)
 *
 * Permet d'activer/désactiver des modules sans toucher au code.
 * Pour désactiver la reconnaissance faciale, mettre enabled: false.
 */

export const FEATURES = {
  /**
   * Reconnaissance faciale via face-api.js
   * - enabled: active/désactive toute la fonctionnalité
   * - threshold: distance euclidienne max pour considérer un match (0.0 = identique, 1.0+ = très différent)
   * - requireFaceForCapture: si true, le bouton "Capturer" est désactivé tant qu'aucun visage n'est détecté
   * - autoVerifyOnScan: si true, lance automatiquement la vérification faciale après un scan QR
   * - modelsPath: chemin vers les fichiers modèles face-api (relatif à public/)
   */
  faceRecognition: {
    enabled: true,
    threshold: 0.6,
    requireFaceForCapture: true,
    autoVerifyOnScan: false,
    modelsPath: '/models/face-api',
  },
} as const

export type FeaturesConfig = typeof FEATURES
