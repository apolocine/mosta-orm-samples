// LockerEventRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { LockerEventSchema } from '../schemas';
import type { IDialect, QueryOptions } from '@mostajs/orm';

export interface LockerEventDTO {
  id: string;
  locker: any;
  client: any;
  rfidTag: any;
  performedBy: any;
  eventType: 'assigned' | 'released' | 'tag_lost' | 'maintenance_start' | 'maintenance_end';
  notes: string | null;
  timestamp: string;
}

export class LockerEventRepository extends BaseRepository<LockerEventDTO> {
  constructor(dialect: IDialect) {
    super(LockerEventSchema, dialect);
  }

  /** Find events for a specific locker with client & performedBy populated */
  async findByLocker(lockerId: string, options?: QueryOptions): Promise<LockerEventDTO[]> {
    return this.findWithRelations(
      { locker: lockerId },
      ['client', 'performedBy'],
      { sort: { timestamp: -1 }, ...options },
    );
  }

  /** Find locker events for a specific client */
  async findByClient(clientId: string, options?: QueryOptions): Promise<LockerEventDTO[]> {
    return this.findWithRelations(
      { client: clientId },
      ['locker', 'performedBy'],
      { sort: { timestamp: -1 }, ...options },
    );
  }

  /** Find all events with optional locker filter, populated */
  async findAllPopulated(filter: Record<string, unknown> = {}, options?: QueryOptions): Promise<LockerEventDTO[]> {
    return this.findWithRelations(
      filter,
      ['locker', 'client', 'performedBy'],
      { sort: { timestamp: -1 }, ...options },
    );
  }

  /** Delete all events for a locker (used before locker deletion) */
  async deleteByLocker(lockerId: string): Promise<number> {
    return this.deleteMany({ locker: lockerId });
  }
}
