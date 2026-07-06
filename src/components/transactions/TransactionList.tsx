'use client';

import { useState, useMemo } from 'react';
import { TransactionCard } from './TransactionCard';

const ITEMS_PER_PAGE = 5;

interface TxItem {
  id: string;
  type: 'income' | 'expense' | 'exchange';
  amount_usd: number;
  amount_bs: number;
  currency_primary: 'USD' | 'Bs';
  category_name?: string;
  description?: string | null;
  transaction_date: string;
  created_at: string;
  receipt_type?: string | null;
  provider_name?: string | null;
  tax_id?: string | null;
  document_type?: string | null;
  transfer_provider?: string | null;
  transfer_operation?: string | null;
}

interface TransactionListProps {
  transactions: TxItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const typeLabels: Record<string, string> = {
  income: 'ingreso',
  expense: 'gasto',
  exchange: 'cambio',
};

export function TransactionList({ transactions, onEdit, onDelete, isAdmin }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      const description = (tx.description ?? '').toLowerCase();
      const category = (tx.category_name ?? '').toLowerCase();
      const usd = String(tx.amount_usd);
      const bs = String(tx.amount_bs);
      const date = tx.transaction_date;
      const type = typeLabels[tx.type] ?? tx.type;

      return (
        description.includes(q) ||
        category.includes(q) ||
        usd.includes(q) ||
        bs.includes(q) ||
        date.includes(q) ||
        type.includes(q)
      );
    });
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-4xl mb-4">📭</p>
        <p>No hay transacciones registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Buscar por descripción, categoría, monto, fecha..."
        className="input-field w-full"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No se encontraron transacciones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              onEdit={onEdit}
              onDelete={isAdmin ? onDelete : undefined}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-sm text-slate-500">
            Página {safePage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
