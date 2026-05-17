import { cleanupOldHistory } from './history';
import { closeAppDatabase, openAppDatabase } from './indexedDb';
import { ensureDefaultSettings } from './settings';

export async function initializeStorage(): Promise<void> {
  const database = await openAppDatabase();

  try {
    await ensureDefaultSettings(database);
    await cleanupOldHistory(database);
  } finally {
    closeAppDatabase(database);
  }
}
