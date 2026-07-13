import { saveOfflineTransaction, getOfflineTransactions, syncOfflineTransactions } from './db';
import { Transaction } from '@/types/transaction';

describe('Background sync — sync.test.ts', () => {
  let mockStore: Record<string, any> = {};
  let originalFetch: typeof fetch;

  beforeEach(() => {
    mockStore = {};

    // Mock IndexedDB
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
    (global as any).self = { indexedDB: mockIndexedDB };

    // Mock Fetch
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (typeof window !== 'undefined' && (window as any).indexedDB) {
      delete (window as any).indexedDB;
    }
    delete (global as any).self;
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
    is_offline_sync: false,
    created_at: '2026-07-11T12:00:00.000Z',
    updated_at: '2026-07-11T12:00:00.000Z',
  };

  it('simula flujo completo online -> offline -> online y verifica la sincronización exitosa', async () => {
    // 1. Empezamos online: el fetch está configurado para responder OK
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'tx-123' } }),
    });

    // 2. Transicionamos a offline: simulamos que el navegador pierde conexión
    // Por lo tanto, cualquier llamada a fetch falla (p.ej., error de red o fetch rechazado)
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

    // 3. El usuario intenta guardar una transacción mientras está offline
    await saveOfflineTransaction(sampleTx);

    // Verificar que quedó guardada en IndexedDB con is_offline_sync = false
    let currentTxs = await getOfflineTransactions();
    expect(currentTxs).toHaveLength(1);
    expect(currentTxs[0].is_offline_sync).toBe(false);

    // 4. Se ejecuta el intento de sincronización mientras sigue offline
    await expect(syncOfflineTransactions()).rejects.toThrow('Failed to fetch');

    // Verificar que la transacción sigue como NO sincronizada (is_offline_sync sigue en false)
    currentTxs = await getOfflineTransactions();
    expect(currentTxs[0].is_offline_sync).toBe(false);

    // 5. El navegador recupera conexión (transición de vuelta a online)
    // El fetch vuelve a responder con éxito (status 201 o ok: true)
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'tx-123' } }),
    });

    // 6. Se dispara la sincronización tras recuperar conexión
    await syncOfflineTransactions();

    // 7. Verificar que se hizo el POST a /api/transactions
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = (global.fetch as jest.Mock).mock.calls[0];
    expect(calledUrl).toBe('/api/transactions');
    expect(calledOptions.method).toBe('POST');
    
    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody.amount_usd).toBe(100);
    expect(parsedBody.category_id).toBe('cat-789');

    // 8. Verificar que el flag de is_offline_sync se actualizó a true en IndexedDB
    currentTxs = await getOfflineTransactions();
    expect(currentTxs).toHaveLength(1);
    expect(currentTxs[0].is_offline_sync).toBe(true);
  });
});
