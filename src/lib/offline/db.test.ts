import { saveOfflineTransaction, getOfflineTransactions, markSynced } from './db';
import { Transaction } from '@/types/transaction';

describe('IndexedDB offline queue — db.ts', () => {
  let mockStore: Record<string, any> = {};

  beforeEach(() => {
    mockStore = {};

    const mockDB = {
      objectStoreNames: {
        contains: () => true,
      },
      createObjectStore: jest.fn(),
      transaction: () => {
        return {
          objectStore: () => {
            return {
              put: (item: any) => {
                const req: any = {};
                setTimeout(() => {
                  mockStore[item.id] = { ...item };
                  if (req.onsuccess) req.onsuccess();
                }, 0);
                return req;
              },
              get: (id: string) => {
                const req: any = {};
                setTimeout(() => {
                  req.result = mockStore[id];
                  if (req.onsuccess) req.onsuccess();
                }, 0);
                return req;
              },
              getAll: () => {
                const req: any = {};
                setTimeout(() => {
                  req.result = Object.values(mockStore);
                  if (req.onsuccess) req.onsuccess();
                }, 0);
                return req;
              },
            };
          },
        };
      },
    };

    const mockOpenRequest: any = {};

    const mockIndexedDB = {
      open: () => {
        setTimeout(() => {
          mockOpenRequest.result = mockDB;
          if (mockOpenRequest.onupgradeneeded) {
            mockOpenRequest.onupgradeneeded();
          }
          if (mockOpenRequest.onsuccess) {
            mockOpenRequest.onsuccess();
          }
        }, 0);
        return mockOpenRequest;
      },
    };

    if (typeof window === 'undefined') {
      (global as any).window = { indexedDB: mockIndexedDB };
    } else {
      (window as any).indexedDB = mockIndexedDB;
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined' && (window as any).indexedDB) {
      delete (window as any).indexedDB;
    }
  });

  const sampleTx: Transaction = {
    id: 'tx-123',
    user_id: 'user-456',
    type: 'expense',
    amount_usd: 100,
    amount_bs: 4500,
    currency_primary: 'USD',
    category_id: 'cat-789',
    description: 'Comida offline',
    receipt_url: null,
    transaction_date: '2026-07-11',
    receipt_type: null,
    provider_name: null,
    tax_id: null,
    document_type: null,
    transfer_provider: null,
    transfer_operation: null,
    original_image_url: null,
    processed_at: null,
    is_offline_sync: true, // we set to true initially to verify saveOfflineTransaction overrides to false
    created_at: '2026-07-11T12:00:00.000Z',
    updated_at: '2026-07-11T12:00:00.000Z',
  };

  it('saveOfflineTransaction fuerza is_offline_sync = false y guarda la transaccion', async () => {
    await saveOfflineTransaction(sampleTx);

    const txs = await getOfflineTransactions();
    expect(txs).toHaveLength(1);
    expect(txs[0].id).toBe('tx-123');
    expect(txs[0].is_offline_sync).toBe(false);
  });

  it('getOfflineTransactions obtiene todas las transacciones de IndexedDB', async () => {
    const tx1 = { ...sampleTx, id: 'tx-1' };
    const tx2 = { ...sampleTx, id: 'tx-2' };

    await saveOfflineTransaction(tx1);
    await saveOfflineTransaction(tx2);

    const txs = await getOfflineTransactions();
    expect(txs).toHaveLength(2);
    expect(txs.map(t => t.id)).toContain('tx-1');
    expect(txs.map(t => t.id)).toContain('tx-2');
  });

  it('markSynced actualiza el flag is_offline_sync a true en la DB offline', async () => {
    await saveOfflineTransaction(sampleTx);

    // Inicialmente debe estar en false tras el guardado
    let txs = await getOfflineTransactions();
    expect(txs[0].is_offline_sync).toBe(false);

    // Marcar como sincronizada
    await markSynced('tx-123');

    // Ahora debe estar en true
    txs = await getOfflineTransactions();
    expect(txs[0].is_offline_sync).toBe(true);
  });
});
