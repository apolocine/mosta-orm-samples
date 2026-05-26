// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IScanLog extends Document {
  ticket: mongoose.Types.ObjectId
  client: mongoose.Types.ObjectId
  activity: mongoose.Types.ObjectId
  scannedBy: mongoose.Types.ObjectId
  scanMethod: 'webcam' | 'pwa_camera'
  result: 'granted' | 'denied'
  denyReason: string | null
  quotaBefore: number | null
  quotaAfter: number | null
  isReentry: boolean
  timestamp: Date
}

const ScanLogSchema = new Schema<IScanLog>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    activity: { type: Schema.Types.ObjectId, ref: 'Activity' },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scanMethod: {
      type: String,
      enum: ['webcam', 'pwa_camera'],
      default: 'webcam',
    },
    result: {
      type: String,
      enum: ['granted', 'denied'],
      required: true,
    },
    denyReason: { type: String, default: null },
    quotaBefore: { type: Number, default: null },
    quotaAfter: { type: Number, default: null },
    isReentry: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  {
    collection: 'scan_logs',
  }
)

ScanLogSchema.index({ client: 1 })
ScanLogSchema.index({ timestamp: -1 })
ScanLogSchema.index({ result: 1 })

const ScanLog: Model<IScanLog> =
  mongoose.models.ScanLog || mongoose.model<IScanLog>('ScanLog', ScanLogSchema)
export default ScanLog
