// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILockerEvent extends Document {
  locker: mongoose.Types.ObjectId
  client: mongoose.Types.ObjectId | null
  rfidTag: mongoose.Types.ObjectId | null
  eventType: 'assigned' | 'released' | 'tag_lost' | 'maintenance_start' | 'maintenance_end'
  performedBy: mongoose.Types.ObjectId
  notes?: string
  timestamp: Date
}

const LockerEventSchema = new Schema<ILockerEvent>(
  {
    locker: { type: Schema.Types.ObjectId, ref: 'Locker', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    rfidTag: { type: Schema.Types.ObjectId, ref: 'RfidTag', default: null },
    eventType: {
      type: String,
      enum: ['assigned', 'released', 'tag_lost', 'maintenance_start', 'maintenance_end'],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  {
    collection: 'locker_events',
  }
)

LockerEventSchema.index({ locker: 1 })
LockerEventSchema.index({ timestamp: -1 })

const LockerEvent: Model<ILockerEvent> =
  mongoose.models.LockerEvent || mongoose.model<ILockerEvent>('LockerEvent', LockerEventSchema)
export default LockerEvent
