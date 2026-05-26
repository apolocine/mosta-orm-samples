// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IClientAccess extends Document {
  client: mongoose.Types.ObjectId
  plan: mongoose.Types.ObjectId | null
  activity: mongoose.Types.ObjectId
  accessType: 'unlimited' | 'count' | 'temporal' | 'mixed'
  totalQuota: number | null
  remainingQuota: number | null
  startDate: Date
  endDate: Date | null
  status: 'active' | 'expired' | 'blocked' | 'depleted'
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ClientAccessSchema = new Schema<IClientAccess>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
    activity: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
    accessType: {
      type: String,
      enum: ['unlimited', 'count', 'temporal', 'mixed'],
      required: true,
    },
    totalQuota: { type: Number, default: null },
    remainingQuota: { type: Number, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'expired', 'blocked', 'depleted'],
      default: 'active',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'client_accesses',
  }
)

ClientAccessSchema.index({ client: 1, activity: 1 })
ClientAccessSchema.index({ client: 1, status: 1 })
ClientAccessSchema.index({ status: 1 })

const ClientAccess: Model<IClientAccess> =
  mongoose.models.ClientAccess ||
  mongoose.model<IClientAccess>('ClientAccess', ClientAccessSchema)
export default ClientAccess
