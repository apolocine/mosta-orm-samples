// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPermission extends Document {
  name: string
  description?: string
  category?: string
  createdAt: Date
  updatedAt: Date
}

const PermissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String },
  },
  {
    timestamps: true,
    collection: 'permissions',
  }
)

const Permission: Model<IPermission> =
  mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema)
export default Permission
