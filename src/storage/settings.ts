import type { AppSettings, AppSettingsInput } from '../types/storage';
import { APP_DATABASE } from './schema';
import {
  closeAppDatabase,
  openAppDatabase,
  requestToPromise,
  transactionDone
} from './indexedDb';

export const SETTINGS_KEY = 'app-settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  key: SETTINGS_KEY,
  version: 1,
  tenants: [
    {
      id: 'room-tenant',
      name: 'Room Tenant',
      phoneNumber: '',
      ratios: {
        water: 1,
        electricity: 1
      }
    },
    {
      id: 'one-bhk-tenant',
      name: '1 BHK Tenant',
      phoneNumber: '',
      ratios: {
        water: 2,
        electricity: 2
      }
    },
    {
      id: 'owner',
      name: 'Owner',
      phoneNumber: '',
      ratios: {
        water: 3,
        electricity: 0
      }
    }
  ],
  updatedAt: new Date(0).toISOString()
};

export async function ensureDefaultSettings(database: IDBDatabase): Promise<void> {
  const transaction = database.transaction(APP_DATABASE.stores.settings, 'readwrite');
  const done = transactionDone(transaction);
  const store = transaction.objectStore(APP_DATABASE.stores.settings);
  const existingSettings = await requestToPromise<AppSettings | undefined>(
    store.get(SETTINGS_KEY) as IDBRequest<AppSettings | undefined>
  );

  if (!existingSettings) {
    store.put({
      ...DEFAULT_APP_SETTINGS,
      updatedAt: new Date().toISOString()
    });
  }

  await done;
}

export async function getAppSettings(): Promise<AppSettings> {
  const database = await openAppDatabase();

  try {
    const transaction = database.transaction(APP_DATABASE.stores.settings, 'readonly');
    const done = transactionDone(transaction);
    const store = transaction.objectStore(APP_DATABASE.stores.settings);
    const settings = await requestToPromise<AppSettings | undefined>(
      store.get(SETTINGS_KEY) as IDBRequest<AppSettings | undefined>
    );
    await done;

    return settings ?? DEFAULT_APP_SETTINGS;
  } finally {
    closeAppDatabase(database);
  }
}

export async function saveAppSettings(input: AppSettingsInput): Promise<AppSettings> {
  const settings: AppSettings = {
    key: SETTINGS_KEY,
    version: 1,
    tenants: input.tenants,
    updatedAt: new Date().toISOString()
  };
  const database = await openAppDatabase();

  try {
    const transaction = database.transaction(APP_DATABASE.stores.settings, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(APP_DATABASE.stores.settings).put(settings);
    await done;

    return settings;
  } finally {
    closeAppDatabase(database);
  }
}
