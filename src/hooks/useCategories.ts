'use client';
import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/transaction';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al obtener categorías');
      setCategories(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = async (name: string, type: 'income' | 'expense' | 'exchange') => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al crear la categoría');
      setCategories((prev) => [...prev, json.data]);
      return json.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string, type: 'income' | 'expense' | 'exchange') => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al actualizar la categoría');
      setCategories((prev) => prev.map((c) => (c.id === id ? json.data : c)));
      return json.data;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al eliminar la categoría');
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, addCategory, updateCategory, deleteCategory, refresh: fetchCategories };
}
