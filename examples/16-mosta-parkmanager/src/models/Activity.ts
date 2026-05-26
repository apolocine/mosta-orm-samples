// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IActivitySchedule {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isOpen: boolean
}

export interface IActivity extends Document {
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  capacity?: number
  currentOccupancy: number
  schedule: IActivitySchedule[]
  ticketValidityMode: 'day_reentry' | 'single_use' | 'time_slot' | 'unlimited'
  ticketDuration: number | null
  price: number
  currency: string
  status: 'active' | 'inactive' | 'maintenance'
  sortOrder: number
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ActivityScheduleSchema = new Schema<IActivitySchedule>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false }
)

const ActivitySchema = new Schema<IActivity>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    icon: { type: String },
    color: { type: String },
    capacity: { type: Number },
    currentOccupancy: { type: Number, default: 0 },
    schedule: [ActivityScheduleSchema],
    ticketValidityMode: {
      type: String,
      enum: ['day_reentry', 'single_use', 'time_slot', 'unlimited'],
      default: 'single_use',
    },
    ticketDuration: { type: Number, default: null },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'DA' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'activities',
  }
)

ActivitySchema.index({ status: 1 })

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)
export default Activity
