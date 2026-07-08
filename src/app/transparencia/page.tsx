'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatUSD, formatBs } from '@/lib/utils/currency';

interface SummaryRow {
  type: string;
  category: string;
  currency_primary: string;
  total_usd: number;
  total_bs: number;
  num_transactions: number;
}

interface TxRow {
  type: string;
  category: string;
  currency_primary: string;
  amount_usd: number;
  amount_bs: number;
  transaction_date: string;
}

type FilterKey = 'all' | 'month' | '3months' | 'year' | 'custom';

const filterLabels: Record<FilterKey, string> = {
  all: 'Todos',
  month: 'Este mes',
  '3months': '3 meses',
  year: 'Este año',
  custom: 'Rango de fechas',
};

function getFilterDates(filter: FilterKey): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from = '';

  switch (filter) {
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      from = d.toISOString().split('T')[0];
      break;
    }
    case '3months': {
      const d = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      from = d.toISOString().split('T')[0];
      break;
    }
    case 'year': {
      const d = new Date(now.getFullYear(), 0, 1);
      from = d.toISOString().split('T')[0];
      break;
    }
    default:
      break;
  }

  return { from, to };
}

const typeLabels: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  exchange: 'Cambio',
};

const ITEMS_PER_PAGE = 10;

export default function TransparenciaPage() {
  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
  const [transactionsData, setTransactionsData] = useState<TxRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchSummaryData = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'custom') {
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      } else {
        const { from, to } = getFilterDates(filter);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
      }

      const res = await fetch(`/api/public/summary?${params}`);
      const json = await res.json();
      setSummaryData(json.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingSummary(false);
    }
  }, [filter, customFrom, customTo]);

  const fetchTransactionsData = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'custom') {
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      } else {
        const { from, to } = getFilterDates(filter);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
      }

      const res = await fetch(`/api/public/transactions?${params}`);
      const json = await res.json();
      setTransactionsData(json.data ?? []);
      setPage(1); // Reset page to 1 when filters change
    } catch {
      // silently fail
    } finally {
      setLoadingTransactions(false);
    }
  }, [filter, customFrom, customTo]);

  useEffect(() => {
    fetchSummaryData();
    fetchTransactionsData();
  }, [fetchSummaryData, fetchTransactionsData]);

  const incomeUSD = summaryData
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + r.total_usd, 0);
  const incomeBs = summaryData
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + r.total_bs, 0);

  const expenseUSD = summaryData
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + r.total_usd, 0);
  const expenseBs = summaryData
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + r.total_bs, 0);

  const exchangeInUSD = summaryData
    .filter((r) => r.type === 'exchange' && r.currency_primary === 'Bs')
    .reduce((s, r) => s + r.total_usd, 0);
  const exchangeOutUSD = summaryData
    .filter((r) => r.type === 'exchange' && r.currency_primary === 'USD')
    .reduce((s, r) => s + r.total_usd, 0);
  const exchangeInBs = summaryData
    .filter((r) => r.type === 'exchange' && r.currency_primary === 'USD')
    .reduce((s, r) => s + r.total_bs, 0);
  const exchangeOutBs = summaryData
    .filter((r) => r.type === 'exchange' && r.currency_primary === 'Bs')
    .reduce((s, r) => s + r.total_bs, 0);

  const totalIncomeUSD = incomeUSD + exchangeInUSD;
  const totalExpenseUSD = expenseUSD + exchangeOutUSD;
  const totalIncomeBs = incomeBs + exchangeInBs;
  const totalExpenseBs = expenseBs + exchangeOutBs;

  const balanceUSD = totalIncomeUSD - totalExpenseUSD;
  const balanceBs = totalIncomeBs - totalExpenseBs;

  const totalTx = summaryData.reduce((s, r) => s + r.num_transactions, 0);

  const totalPages = Math.max(1, Math.ceil(transactionsData.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedTransactions = transactionsData.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Finty — Transparencia</h1>
          <p className="text-slate-400">
            Registro público de ingresos y egresos de fondos humanitarios
          </p>
        </header>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="card-glass p-5 space-y-2">
            <p className="text-sm text-slate-400">Total Ingresos</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 shrink-0 text-xs font-medium text-slate-500">Bs</span>
              <p className="min-w-0 flex-1 break-words text-base sm:text-lg font-semibold text-emerald-300/80">{formatBs(totalIncomeBs)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 text-xs font-medium text-slate-500">USD</span>
              <p className="min-w-0 flex-1 break-words text-lg sm:text-xl font-bold text-emerald-400">{formatUSD(totalIncomeUSD)}</p>
            </div>
          </div>
          <div className="card-glass p-5 space-y-2">
            <p className="text-sm text-slate-400">Total Egresos</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 shrink-0 text-xs font-medium text-slate-500">Bs</span>
              <p className="min-w-0 flex-1 break-words text-base sm:text-lg font-semibold text-red-300/80">{formatBs(totalExpenseBs)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 text-xs font-medium text-slate-500">USD</span>
              <p className="min-w-0 flex-1 break-words text-lg sm:text-xl font-bold text-red-400">{formatUSD(totalExpenseUSD)}</p>
            </div>
          </div>
          <div className="card-glass p-5 space-y-2">
            <p className="text-sm text-slate-400">Balance</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 shrink-0 text-xs font-medium text-slate-500">Bs</span>
              <p className={`text-lg lg:text-base font-semibold ${balanceBs >= 0 ? 'text-blue-300/80' : 'text-red-300/80'}`}>
                {formatBs(balanceBs)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 text-xs font-medium text-slate-500">USD</span>
              <p className={`text-xl font-bold ${balanceUSD >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatUSD(balanceUSD)}
              </p>
            </div>
          </div>
          <div className="card-glass p-5 space-y-2">
            <p className="text-sm text-slate-400">Transacciones</p>
            <div className="flex items-center gap-2">
              <span className="w-8 text-xs font-medium text-slate-500">#</span>
              <p className="min-w-0 flex-1 break-words text-lg sm:text-xl font-bold text-blue-400">{totalTx}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 mb-4">
          <label className="text-xs text-slate-500 block mb-1.5">Filtrar por periodo:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-full sm:w-auto"
          >
            {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
              <option key={key} value={key}>
                {filterLabels[key]}
              </option>
            ))}
          </select>

          {filter === 'custom' && (
            <div className="flex flex-wrap gap-3 items-end mt-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Desde</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Hasta</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-slate-400 font-medium">Fecha</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-right">Bs</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-right">USD</th>
                </tr>
              </thead>
              <tbody>
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Cargando transacciones...
                    </td>
                  </tr>
                ) : transactionsData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Sin transacciones disponibles
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((row, i) => (
                    <tr key={`${row.type}-${row.category}-${row.transaction_date}-${i}`} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-300">{row.transaction_date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            row.type === 'income'
                              ? 'bg-green-500/10 text-green-400'
                              : row.type === 'expense'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {typeLabels[row.type] ?? row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{row.category}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {formatBs(row.amount_bs)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {formatUSD(row.amount_usd)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loadingTransactions && transactionsData.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
              <p className="text-xs text-slate-500">
                Página {safePage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
