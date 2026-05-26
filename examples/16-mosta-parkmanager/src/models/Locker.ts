// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILocker extends Document {
  number: number
  zone: 'A' | 'B' | 'C'
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order'
  rfidLockId?: string
  currentClient: mongoose.Types.ObjectId | null
  currentTag: mongoose.Types.ObjectId | null
  lastAssignedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const LockerSchema = new Schema<ILocker>(
  {
    number: { type: Number, required: true, unique: true },
    zone: { type: String, enum: ['A', 'B', 'C'], required: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'out_of_order'],
      default: 'available',
    },
    rfidLockId: { type: String },
    currentClient: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    currentTag: { type: Schema.Types.ObjectId, ref: 'RfidTag', default: null },
    lastAssignedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'lockers',
  }
)

LockerSchema.index({ zone: 1 })
LockerSchema.index({ status: 1 })

const Locker: Model<ILocker> =
  mongoose.models.Locker || mongoose.model<ILocker>('Locker', LockerSchema)
export default Locker
