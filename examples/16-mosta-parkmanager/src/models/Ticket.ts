// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITicket extends Document {
  ticketNumber: string
  client: mongoose.Types.ObjectId
  clientAccess: mongoose.Types.ObjectId
  activity: mongoose.Types.ObjectId
  ticketType: 'standard' | 'cadeau'
  sourceClient: mongoose.Types.ObjectId | null
  qrCode: string
  clientName: string
  activityName: string
  validityMode: string
  validUntil: Date | null
  status: 'active' | 'used' | 'expired' | 'cancelled'
  scannedAt: Date | null
  scannedBy: mongoose.Types.ObjectId | null
  amount: number
  currency: string
  printCount: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

async function getNextTicketNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

  const Counter =
    mongoose.models.Counter ||
    mongoose.model('Counter', new Schema({ _id: String, seq: { type: Number, default: 0 } }))

  const counter = await Counter.findByIdAndUpdate(
    `ticket-${dateStr}`,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  )
  return `TKT-${dateStr}-${String(counter.seq).padStart(4, '0')}`
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    clientAccess: { type: Schema.Types.ObjectId, ref: 'ClientAccess', required: true },
    activity: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
    ticketType: {
      type: String,
      enum: ['standard', 'cadeau'],
      default: 'standard',
    },
    sourceClient: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    qrCode: { type: String, unique: true },
    clientName: { type: String, required: true },
    activityName: { type: String, required: true },
    validityMode: { type: String, required: true },
    validUntil: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'used', 'expired', 'cancelled'],
      default: 'active',
    },
    scannedAt: { type: Date, default: null },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'DA' },
    printCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'tickets',
  }
)

TicketSchema.index({ client: 1 })
TicketSchema.index({ status: 1 })
TicketSchema.index({ validUntil: 1 })

TicketSchema.pre('save', async function () {
  if (!this.ticketNumber) {
    this.ticketNumber = await getNextTicketNumber()
  }
  if (!this.qrCode) {
    this.qrCode = require('crypto').randomUUID()
  }
})

const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema)
export default Ticket
