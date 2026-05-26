// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  permissions: string[]
  status: 'active' | 'locked' | 'disabled'
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      required: true,
    },
    permissions: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'locked', 'disabled'],
      default: 'active',
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
)

UserSchema.index({ role: 1 })
UserSchema.index({ status: 1 })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export default User
