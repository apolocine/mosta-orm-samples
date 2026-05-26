// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRole extends Document {
  name: string
  description?: string
  permissions: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  },
  {
    timestamps: true,
    collection: 'roles',
  }
)

const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema)
export default Role
