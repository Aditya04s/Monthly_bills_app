import type { DatabaseSchema } from '../types/storage';

export const APP_DATABASE: DatabaseSchema = {
  name: 'bill-app',
  version: 2,
  stores: {
    history: 'calculation-history',
    settings: 'settings'
  }
};
