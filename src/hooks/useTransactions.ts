'use client';

import { useState, useCallback } from 'react';
import type { Transaction, TransactionInput } from '@/types/transaction';

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
