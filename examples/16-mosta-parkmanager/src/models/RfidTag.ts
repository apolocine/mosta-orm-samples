// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRfidTag extends Document {
  tagId: string
  client: mongoose.Types.ObjectId | null
  status: 'available' | 'active' | 'deactivated' | 'lost'
  assignedAt: Date | null
  deactivatedAt: Date | null
  assignedBy: mongoose.Types.ObjectId | null
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const RfidTagSchema = new Schema<IRfidTag>(
  {
    tagId: { type: String, required: true, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    status: {
      type: String,
      enum: ['available', 'active', 'deactivated', 'lost'],
      default: 'available',
    },
    assignedAt: { type: Date, default: null },
    deactivatedAt: { type: Date, default: null },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String },
  },
  {
    timestamps: true,
    collection: 'rfid_tags',
  }
)

RfidTagSchema.index({ status: 1 })
RfidTagSchema.index({ client: 1 })

const RfidTag: Model<IRfidTag> =
  mongoose.models.RfidTag || mongoose.model<IRfidTag>('RfidTag', RfidTagSchema)
export default RfidTag
