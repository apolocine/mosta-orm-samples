// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IClient extends Document {
  clientNumber: string
  clientType: 'abonne' | 'visiteur'
  firstName: string
  lastName: string
  phone?: string
  email?: string
  dateOfBirth?: Date
  gender?: 'male' | 'female'
  photo?: string
  faceDescriptor?: number[]
  address?: string
  wilaya?: string
  qrCode: string
  rfidTagId?: mongoose.Types.ObjectId
  status: 'active' | 'inactive' | 'suspended'
  notes?: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

async function getNextClientNumber(): Promise<string> {
  const Counter =
    mongoose.models.Counter ||
    mongoose.model(
      'Counter',
      new Schema({ _id: String, seq: { type: Number, default: 0 } })
    )

  const counter = await Counter.findByIdAndUpdate(
    'clientNumber',
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  )
  return `CLI-${String(counter.seq).padStart(5, '0')}`
}

const ClientSchema = new Schema<IClient>(
  {
    clientNumber: { type: String, unique: true },
    clientType: {
      type: String,
      enum: ['abonne', 'visiteur'],
      required: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female'] },
    photo: { type: String },
    faceDescriptor: { type: [Number], default: undefined },
    address: { type: String },
    wilaya: { type: String },
    qrCode: { type: String, unique: true },
    rfidTagId: { type: Schema.Types.ObjectId, ref: 'RfidTag' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'clients',
  }
)

ClientSchema.index({ phone: 1 })
ClientSchema.index({ status: 1 })
ClientSchema.index({ clientType: 1 })
ClientSchema.index({ firstName: 'text', lastName: 'text', phone: 'text', clientNumber: 'text' })

ClientSchema.pre('save', async function () {
  if (!this.clientNumber) {
    this.clientNumber = await getNextClientNumber()
  }
  if (!this.qrCode) {
    this.qrCode = require('crypto').randomUUID()
  }
})

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema)
export default Client
