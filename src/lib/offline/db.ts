import { Transaction } from '@/types/transaction';

const DB_NAME = 'finty_offline_db';
const STORE_NAME = 'offline_transactions';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveOfflineTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const updatedTx = { ...tx, is_offline_sync: false };
      const request = store.put(updatedTx);

      request.onerror = () => {
        reject(request.error || new Error('Failed to save offline transaction'));
      };

      request.onsuccess = () => {
        resolve();
      };
    } catch (err) {
      reject(err);
    }
  });
}

export async function getOfflineTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        reject(request.error || new Error('Failed to get offline transactions'));
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    } catch (err) {
      reject(err);
    }
  });
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onerror = () => {
        reject(getRequest.error || new Error(`Failed to get transaction with id ${id}`));
      };

      getRequest.onsuccess = () => {
        const tx = getRequest.result;
        if (!tx) {
          reject(new Error(`Transaction with id ${id} not found in offline store`));
          return;
        }

        tx.is_offline_sync = true;
        const putRequest = store.put(tx);

        putRequest.onerror = () => {
          reject(putRequest.error || new Error(`Failed to update transaction with id ${id}`));
        };

        putRequest.onsuccess = () => {
          resolve();
        };
      };
    } catch (err) {
      reject(err);
    }
  });
}
