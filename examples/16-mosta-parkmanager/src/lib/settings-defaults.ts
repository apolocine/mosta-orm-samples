// Author: Dr Hamid MADANI drmdh@msn.com
/** Shared defaults and types for settings — safe for client-side import */

export const DEFAULTS = {
  faceRecognitionEnabled: true,
  faceRecognitionThreshold: 0.6,
  faceRequireForCapture: true,
  faceAutoVerify: false,
  ticketTemplate: 'thermal80' as 'thermal80' | 'thermal58' | 'a4',
}

export type AppSettings = typeof DEFAULTS
