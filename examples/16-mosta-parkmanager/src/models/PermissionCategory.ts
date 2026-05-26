// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPermissionCategory extends Document {
  name: string
  label: string
  description?: string
  icon?: string
  order: number
  system: boolean
  createdAt: Date
  updatedAt: Date
}

const PermissionCategorySchema = new Schema<IPermissionCategory>(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String },
    icon: { type: String },
    order: { type: Number, default: 0 },
    system: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'permission_categories',
  }
)

PermissionCategorySchema.index({ order: 1, name: 1 })

const PermissionCategory: Model<IPermissionCategory> =
  mongoose.models.PermissionCategory || mongoose.model<IPermissionCategory>('PermissionCategory', PermissionCategorySchema)
export default PermissionCategory
