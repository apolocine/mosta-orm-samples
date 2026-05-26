// SettingRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { SettingSchema } from '../schemas';
import type { IDialect } from '@mostajs/orm';

export interface SettingDTO {
  id: string;
  key: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export class SettingRepository extends BaseRepository<SettingDTO> {
  constructor(dialect: IDialect) {
    super(SettingSchema, dialect);
  }

  /** Find a setting by its key */
  async findByKey(key: string): Promise<SettingDTO | null> {
    return this.findOne({ key });
  }

  /** Upsert a setting by key */
  async upsertByKey(key: string, value: unknown): Promise<SettingDTO> {
    return this.upsert({ key }, { key, value });
  }

  /** Find all settings as a key-value map */
  async findAllSettings(): Promise<Record<string, unknown>> {
    const rows = await this.findAll();
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  }
}
