// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPlanActivity {
  activity: mongoose.Types.ObjectId
  sessionsCount: number | null
}

export interface ISubscriptionPlan extends Document {
  name: string
  description?: string
  type: 'temporal' | 'usage' | 'mixed'
  duration: number | null
  activities: IPlanActivity[]
  price: number
  currency: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PlanActivitySchema = new Schema(
  {
    activity: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
    sessionsCount: { type: Number, default: null },
  },
  { _id: false }
)

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['temporal', 'usage', 'mixed'],
      required: true,
    },
    duration: { type: Number, default: null },
    activities: [PlanActivitySchema],
    price: { type: Number, required: true },
    currency: { type: String, default: 'DA' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'subscription_plans',
  }
)

SubscriptionPlanSchema.index({ isActive: 1 })

const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema)
export default SubscriptionPlan
