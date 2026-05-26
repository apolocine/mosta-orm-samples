// ClientRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { randomUUID } from 'crypto';
import { BaseRepository } from '@mostajs/orm';
import { ClientSchema, CounterSchema } from '../schemas';
import type { IDialect, FilterQuery, QueryOptions, PaginatedResult } from '@mostajs/orm';

export interface ClientDTO {
  id: string;
  clientNumber: string;
  clientType: 'abonne' | 'visiteur';
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  photo?: string;
  faceDescriptor?: number[];
  address?: string;
  wilaya?: string;
  qrCode: string;
  rfidTagId?: any;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class ClientRepository extends BaseRepository<ClientDTO> {
  constructor(dialect: IDialect) {
    super(ClientSchema, dialect);
  }

  /** Generate next client number: CLI-00001, CLI-00002... */
  async getNextClientNumber(): Promise<string> {
    const counterRepo = new BaseRepository(CounterSchema, this.dialect);
    const counter = await counterRepo.increment('clientNumber', 'seq', 1);
    const seq = (counter as any)?.seq ?? 1;
    return `CLI-${String(seq).padStart(5, '0')}`;
  }

  /** Create client with auto-generated clientNumber and qrCode */
  async createWithAutoFields(data: Partial<ClientDTO>): Promise<ClientDTO> {
    if (!data.clientNumber) {
      data.clientNumber = await this.getNextClientNumber();
    }
    const created = await this.create(data);
    if (!data.qrCode) {
      const uuid = randomUUID();
      await this.update(created.id, { qrCode: uuid } as any);
      created.qrCode = uuid;
    }
    return created;
  }

  /** Search clients by name/phone/clientNumber/email (regex) */
  async searchClients(query: string, options?: QueryOptions): Promise<ClientDTO[]> {
    return this.search(query, options);
  }

  /** Override search to target specific fields */
  override async search(query: string, options?: QueryOptions): Promise<ClientDTO[]> {
    const fields = ['firstName', 'lastName', 'phone', 'clientNumber', 'email'];
    const docs = await this.dialect.search(this.schema, query, fields, options);
    const { normalizeDocs } = await import('@mostajs/orm');
    return normalizeDocs<ClientDTO>(docs);
  }

  /** Paginated list with optional filters */
  async findPaginated(
    filter: FilterQuery = {},
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<ClientDTO>> {
    const [data, total] = await Promise.all([
      this.findAll(filter, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
      this.count(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Find client by ID with RFID tag populated */
  async findByIdWithRfid(id: string): Promise<ClientDTO | null> {
    return this.findByIdWithRelations(id, ['rfidTagId']);
  }

  /** Find by QR code field */
  async findByQrCode(qrCode: string): Promise<ClientDTO | null> {
    return this.findOne({ qrCode });
  }

  /** Soft-delete: mark as inactive */
  async softDelete(id: string): Promise<ClientDTO | null> {
    return this.update(id, { status: 'inactive' } as any);
  }

  /** Count active subscribers */
  async countActiveSubscribers(): Promise<number> {
    return this.count({ clientType: 'abonne', status: 'active' });
  }
}
