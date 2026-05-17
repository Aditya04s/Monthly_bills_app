import type { BillCalculationResult } from '../types/calculation';
import type { CalculationHistoryEntry } from '../types/storage';
import { APP_DATABASE } from './schema';
import {
  closeAppDatabase,
  openAppDatabase,
  requestToPromise,
  transactionDone
} from './indexedDb';

const HISTORY_RETENTION_MONTHS = 6;

export function createCalculationHistoryEntry(
  result: BillCalculationResult,
  now = new Date()
): CalculationHistoryEntry {
  return {
    id: createId(now),
    waterBillAmount: result.input.waterBillAmount.value,
    electricityBillAmount: result.input.electricityBillAmount.value,
    partyBreakdowns: result.parties,
    ratios: result.input.parties,
    result,
    timestamp: now.toISOString(),
    date: formatDateKey(now)
  };
}

export async function saveCalculationHistory(
  result: BillCalculationResult
): Promise<CalculationHistoryEntry> {
  const database = await openAppDatabase();
  const entry = createCalculationHistoryEntry(result);

  try {
    await putCalculationHistoryEntry(database, entry);
    await cleanupOldHistory(database).catch(() => undefined);

    return entry;
  } finally {
    closeAppDatabase(database);
  }
}

export async function getCalculationHistory(): Promise<CalculationHistoryEntry[]> {
  const database = await openAppDatabase();

  try {
    const transaction = database.transaction(APP_DATABASE.stores.history, 'readonly');
    const done = transactionDone(transaction);
    const index = transaction.objectStore(APP_DATABASE.stores.history).index('timestamp');
    const entries: CalculationHistoryEntry[] = [];

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(null, 'prev');

      request.onsuccess = () => {
        const cursor = request.result;

        if (!cursor) {
          resolve();
          return;
        }

        entries.push(cursor.value as CalculationHistoryEntry);
        cursor.continue();
      };

      request.onerror = () => {
        reject(request.error ?? new Error('Unable to read calculation history.'));
      };
    });
    await done;

    return entries;
  } finally {
    closeAppDatabase(database);
  }
}

export async function getCalculationHistoryEntry(
  id: string
): Promise<CalculationHistoryEntry | undefined> {
  const database = await openAppDatabase();

  try {
    const transaction = database.transaction(APP_DATABASE.stores.history, 'readonly');
    const done = transactionDone(transaction);
    const request = transaction.objectStore(APP_DATABASE.stores.history).get(id);
    const entry = await requestToPromise<CalculationHistoryEntry | undefined>(
      request as IDBRequest<CalculationHistoryEntry | undefined>
    );
    await done;

    return entry;
  } finally {
    closeAppDatabase(database);
  }
}

export async function deleteCalculationHistoryEntry(id: string): Promise<void> {
  const database = await openAppDatabase();

  try {
    const transaction = database.transaction(APP_DATABASE.stores.history, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(APP_DATABASE.stores.history).delete(id);
    await done;
  } finally {
    closeAppDatabase(database);
  }
}

export async function clearCalculationHistory(): Promise<void> {
  const database = await openAppDatabase();

  try {
    const transaction = database.transaction(APP_DATABASE.stores.history, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(APP_DATABASE.stores.history).clear();
    await done;
  } finally {
    closeAppDatabase(database);
  }
}

export async function cleanupOldHistory(existingDatabase?: IDBDatabase): Promise<number> {
  const database = existingDatabase ?? (await openAppDatabase());

  try {
    return await deleteOlderHistoryEntries(database, getRetentionCutoff(new Date()));
  } finally {
    if (!existingDatabase) {
      closeAppDatabase(database);
    }
  }
}

async function putCalculationHistoryEntry(
  database: IDBDatabase,
  entry: CalculationHistoryEntry
): Promise<void> {
  const transaction = database.transaction(APP_DATABASE.stores.history, 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(APP_DATABASE.stores.history).put(entry);
  await done;
}

async function deleteOlderHistoryEntries(database: IDBDatabase, cutoff: Date): Promise<number> {
  const transaction = database.transaction(APP_DATABASE.stores.history, 'readwrite');
  const done = transactionDone(transaction);
  const index = transaction.objectStore(APP_DATABASE.stores.history).index('timestamp');
  const range = IDBKeyRange.upperBound(cutoff.toISOString(), true);
  let deletedCount = 0;

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;

      if (!cursor) {
        resolve();
        return;
      }

      cursor.delete();
      deletedCount += 1;
      cursor.continue();
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Unable to clean old calculation history.'));
    };
  });
  await done;

  return deletedCount;
}

function getRetentionCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - HISTORY_RETENTION_MONTHS);
  return cutoff;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createId(date: Date): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${date.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
}
