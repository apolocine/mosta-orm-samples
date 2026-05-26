// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document } from 'mongoose'

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId
  userName: string
  userRole: string
  action: string
  module: string
  resource: string
  resourceId: string
  details: any
  ipAddress: string
  status: 'success' | 'failure'
  timestamp: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  module: {
    type: String,
    required: true,
    enum: ['clients', 'tickets', 'scan', 'lockers', 'rfid', 'access', 'users', 'activities', 'plans', 'settings'],
  },
  resource: { type: String, default: '' },
  resourceId: { type: String, default: '' },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String, default: '' },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success',
  },
  timestamp: { type: Date, default: Date.now },
})

AuditLogSchema.index({ timestamp: -1 })
AuditLogSchema.index({ module: 1, timestamp: -1 })
AuditLogSchema.index({ userId: 1, timestamp: -1 })

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
