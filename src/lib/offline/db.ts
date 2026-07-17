import { Transaction } from '@/types/transaction';

const DB_NAME = 'finty_offline_db';
const STORE_NAME = 'offline_transactions';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const globalIndexedDB =
      (typeof window !== 'undefined' && window.indexedDB) ||
      (typeof self !== 'undefined' && self.indexedDB) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).indexedDB);

    if (!globalIndexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = globalIndexedDB.open(DB_NAME, DB_VERSION);

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

export async function syncOfflineTransactions(): Promise<void> {
  const txs = await getOfflineTransactions();
  const unsynced = txs.filter((tx) => !tx.is_offline_sync);

  for (const tx of unsynced) {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: tx.type,
          amount_usd: tx.amount_usd,
          amount_bs: tx.amount_bs,
          currency_primary: tx.currency_primary,
          category_id: tx.category_id,
          description: tx.description || '',
          receipt_url: tx.receipt_url || '',
          transaction_date: tx.transaction_date,
          receipt_type: tx.receipt_type,
          provider_name: tx.provider_name,
          tax_id: tx.tax_id,
          document_type: tx.document_type,
          transfer_provider: tx.transfer_provider,
          transfer_operation: tx.transfer_operation,
          original_image_url: tx.original_image_url,
          processed_at: tx.processed_at,
        }),
      });

      if (response.ok) {
        await markSynced(tx.id);
      } else {
        const errText = await response.text();
        console.error(`Failed to sync transaction ${tx.id}:`, errText);
        throw new Error(`Sync failed with status ${response.status}: ${errText}`);
      }
    } catch (error) {
      console.error(`Error syncing transaction ${tx.id}:`, error);
      throw error;
    }
  }
}

// --- Cola offline de categorías (Bug 1, 5.9) ---

const CATEGORY_STORE = 'offline_categories';

function getCategoryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const globalIndexedDB =
      (typeof window !== 'undefined' && window.indexedDB) ||
      (typeof self !== 'undefined' && self.indexedDB) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).indexedDB);

    if (!globalIndexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = globalIndexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error || new Error('Failed to open database'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CATEGORY_STORE)) {
        db.createObjectStore(CATEGORY_STORE, { keyPath: 'id' });
      }
    };
  });
}

interface OfflineCategory {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'exchange';
  is_offline_sync: boolean;
}

export async function saveOfflineCategory(cat: OfflineCategory): Promise<void> {
  const db = await getCategoryDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(CATEGORY_STORE, 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.put({ ...cat, is_offline_sync: false });
      request.onerror = () => reject(request.error || new Error('Failed to save offline category'));
      request.onsuccess = () => resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function getOfflineCategories(): Promise<OfflineCategory[]> {
  const db = await getCategoryDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(CATEGORY_STORE, 'readonly');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    } catch (err) {
      reject(err);
    }
  });
}

async function markCategorySynced(id: string): Promise<void> {
  const db = await getCategoryDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(CATEGORY_STORE, 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE);
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const cat = getRequest.result;
        if (!cat) return resolve();
        cat.is_offline_sync = true;
        store.put(cat);
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function syncOfflineCategories(): Promise<void> {
  const cats = await getOfflineCategories();
  const unsynced = cats.filter((c) => !c.is_offline_sync);
  for (const cat of unsynced) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cat.name, type: cat.type }),
      });
      if (response.ok) {
        await markCategorySynced(cat.id);
      } else {
        const errText = await response.text();
        throw new Error(`Sync category failed ${response.status}: ${errText}`);
      }
    } catch (error) {
      console.error(`Error syncing category ${cat.id}:`, error);
      throw error;
    }
  }
}

// Dispara la sincronización (background sync + mensaje al SW) cuando hay red.
export async function triggerOfflineSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // Background Sync (si el SW lo registró)
  if ('sync' in (globalThis as any).ServiceWorker) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register('sync-transactions');
    } catch {
      // ignore
    }
  }

  // Fallback: mensaje directo al SW
  const controller = navigator.serviceWorker?.controller;
  if (controller) {
    controller.postMessage({ type: 'SYNC_TRANSACTIONS' });
  }
}
