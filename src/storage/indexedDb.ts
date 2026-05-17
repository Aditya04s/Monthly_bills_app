import { APP_DATABASE } from './schema';

export function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function openAppDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(APP_DATABASE.name, APP_DATABASE.version);

    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;

      let historyStore: IDBObjectStore;
      if (!database.objectStoreNames.contains(APP_DATABASE.stores.history)) {
        historyStore = database.createObjectStore(APP_DATABASE.stores.history, {
          keyPath: 'id'
        });
      } else if (transaction) {
        historyStore = transaction.objectStore(APP_DATABASE.stores.history);
      } else {
        return;
      }

      ensureIndex(historyStore, 'timestamp', 'timestamp');
      ensureIndex(historyStore, 'date', 'date');

      if (!database.objectStoreNames.contains(APP_DATABASE.stores.settings)) {
        database.createObjectStore(APP_DATABASE.stores.settings, {
          keyPath: 'key'
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Unable to open the app database.'));
    };

    request.onblocked = () => {
      reject(new Error('Opening the app database was blocked by another tab.'));
    };
  });
}

export function closeAppDatabase(database: IDBDatabase): void {
  database.close();
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'));
    };
  });
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
    };
  });
}

function ensureIndex(store: IDBObjectStore, name: string, keyPath: string) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath);
  }
}
