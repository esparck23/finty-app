'use client';

import { useState, useCallback } from 'react';
import type { Transaction, TransactionInput } from '@/types/transaction';
import { saveOfflineTransaction, triggerOfflineSync } from '@/lib/offline/db';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchTransactions = useCallback(async (filters?: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTransactions(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTransaction = useCallback(async (data: TransactionInput) => {
    setIsLoading(true);
    setError(null);
    try {
      // Bug 1 (5.9): offline → encolar en IndexedDB + disparar sync.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        const offlineTx: Transaction = {
          ...data,
          id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          created_at: new Date().toISOString(),
          processed_at: null,
          receipt_url: null,
          original_image_url: null,
        } as Transaction;
        await saveOfflineTransaction(offlineTx);
        await triggerOfflineSync();
        setTransactions((prev) => [offlineTx, ...prev]);
        return offlineTx;
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const created = json.data as Transaction;
      setTransactions((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, data: TransactionInput) => {
    setIsLoading(true);
    setError(null);
    try {
      // Bug 1 (5.9): offline → encolar edición en IndexedDB + disparar sync.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        const offlineTx: Transaction = {
          ...data,
          id,
          created_at: new Date().toISOString(),
          processed_at: null,
          receipt_url: null,
          original_image_url: null,
        } as Transaction;
        await saveOfflineTransaction(offlineTx);
        await triggerOfflineSync();
        setTransactions((prev) => prev.map((t) => (t.id === id ? offlineTx : t)));
        return offlineTx;
      }

      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const updated = json.data as Transaction;
      setTransactions((prev) => prev.map((t) => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    transactions,
    isLoading,
    error,
    pagination,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
