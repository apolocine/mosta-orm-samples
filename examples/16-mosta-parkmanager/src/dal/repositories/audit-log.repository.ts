// AuditLogRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { AuditLogSchema } from '../schemas';
import type { IDialect, FilterQuery, QueryOptions } from '@mostajs/orm';

export interface AuditLogDTO {
  id: string;
  userId: any;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown> | null;
  ipAddress: string;
  status: 'success' | 'failure';
  timestamp: string;
}

export class AuditLogRepository extends BaseRepository<AuditLogDTO> {
  constructor(dialect: IDialect) {
    super(AuditLogSchema, dialect);
  }

  /** Find paginated audit logs with optional filters (module, action, userId, date range) */
  async findPaginated(
    filters: {
      module?: string;
      action?: string;
      userId?: string;
      from?: Date;
      to?: Date;
    } = {},
    options?: QueryOptions,
  ): Promise<{ data: AuditLogDTO[]; total: number }> {
    const query: FilterQuery = {};

    if (filters.module) query.module = filters.module;
    if (filters.action) query.action = { $regex: filters.action, $regexFlags: 'i' };
    if (filters.userId) query.userId = filters.userId;
    if (filters.from || filters.to) {
      query.timestamp = {};
      if (filters.from) (query.timestamp as any).$gte = filters.from;
      if (filters.to) (query.timestamp as any).$lte = filters.to;
    }

    const [data, total] = await Promise.all([
      this.findAll(query, { sort: { timestamp: -1 }, ...options }),
      this.count(query),
    ]);

    return { data, total };
  }

  /** Find audit logs related to a specific client (modules: clients, access, rfid) */
  async findByClientContext(clientId: string, options?: QueryOptions): Promise<AuditLogDTO[]> {
    return this.findAll(
      {
        resourceId: clientId,
        module: { $in: ['clients', 'access', 'rfid'] },
      },
      { sort: { timestamp: -1 }, ...options },
    );
  }
}
