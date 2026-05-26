// TicketRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { randomUUID } from 'crypto';
import { BaseRepository } from '@mostajs/orm';
import { TicketSchema, CounterSchema } from '../schemas';
import type { IDialect, FilterQuery, QueryOptions } from '@mostajs/orm';

export interface TicketDTO {
  id: string;
  ticketNumber: string;
  client: any;
  clientAccess: any;
  activity: any;
  ticketType: 'standard' | 'cadeau';
  sourceClient: any;
  qrCode: string;
  clientName: string;
  activityName: string;
  validityMode: string;
  validUntil: string | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  scannedAt: string | null;
  scannedBy: any;
  amount: number;
  currency: string;
  printCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class TicketRepository extends BaseRepository<TicketDTO> {
  constructor(dialect: IDialect) {
    super(TicketSchema, dialect);
  }

  /** Generate next ticket number: TKT-20260228-0001 */
  async getNextTicketNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const counterRepo = new BaseRepository(CounterSchema, this.dialect);
    const counter = await counterRepo.increment(`ticket-${dateStr}`, 'seq', 1);
    const seq = (counter as any)?.seq ?? 1;
    return `TKT-${dateStr}-${String(seq).padStart(4, '0')}`;
  }

  /** Create ticket with auto-generated ticketNumber and qrCode */
  async createWithAutoFields(data: Partial<TicketDTO>): Promise<TicketDTO> {
    if (!data.ticketNumber) {
      data.ticketNumber = await this.getNextTicketNumber();
    }
    const created = await this.create(data);
    if (!data.qrCode) {
      const uuid = randomUUID();
      await this.update(created.id, { qrCode: uuid } as any);
      created.qrCode = uuid;
    }
    return created;
  }

  /** Find by QR code field */
  async findByQrCode(qrCode: string): Promise<TicketDTO | null> {
    return this.findOne({ qrCode });
  }

  /** Find tickets for a client */
  async findByClient(clientId: string, options?: QueryOptions): Promise<TicketDTO[]> {
    return this.findAll({ client: clientId }, { sort: { createdAt: -1 }, ...options });
  }

  /** Count tickets for a given clientAccess */
  async countByAccess(clientAccessId: string): Promise<number> {
    return this.count({ clientAccess: clientAccessId });
  }

  /** Count tickets grouped by clientAccess (for access grid) */
  async countsByAccess(accessIds: string[]): Promise<{ clientAccess: string; count: number }[]> {
    if (accessIds.length === 0) return [];
    return this.aggregate([
      { $match: { clientAccess: { $in: accessIds } } as any },
      { $group: { _by: 'clientAccess', count: { $sum: 1 } } },
    ]);
  }

  /** Mark ticket as used */
  async markUsed(id: string, scannedBy: string): Promise<TicketDTO | null> {
    return this.update(id, {
      status: 'used',
      scannedAt: new Date(),
      scannedBy,
    } as any);
  }
}
