// Setting Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const SettingSchema: EntitySchema = {
  name: 'Setting',
  collection: 'settings',
  timestamps: true,

  fields: {
    key:   { type: 'string', required: true, unique: true },
    value: { type: 'json', required: true },
  },

  relations: {},

  indexes: [],
};
