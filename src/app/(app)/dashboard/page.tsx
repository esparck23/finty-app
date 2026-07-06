'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatUSD, formatBs } from '@/lib/utils/currency';

export default function DashboardPage() {
  const router = useRouter();
  const {
    transactions, isLoading, fetchTransactions
  } = useTransactions();

  useEffect(() => {
    fetchTransactions({ limit: '50' });
  }, [fetchTransactions]);

  const incomeUSD = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);
  const incomeBs = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount_bs), 0);

  const expenseUSD = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);
  const expenseBs = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount_bs), 0);

  const exchangeOutUSD = transactions
    .filter((t) => t.type === 'exchange' && t.currency_primary === 'USD')
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);
  const exchangeInBs = transactions
    .filter((t) => t.type === 'exchange' && t.currency_primary === 'USD')
    .reduce((sum, t) => sum + Number(t.amount_bs), 0);

  const exchangeInUSD = transactions
    .filter((t) => t.type === 'exchange' && t.currency_primary === 'Bs')
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);
  const exchangeOutBs = transactions
    .filter((t) => t.type === 'exchange' && t.currency_primary === 'Bs')
    .reduce((sum, t) => sum + Number(t.amount_bs), 0);

  const totalIncomeUSD = incomeUSD + exchangeInUSD;
  const totalExpenseUSD = expenseUSD + exchangeOutUSD;
  const totalIncomeBs = incomeBs + exchangeInBs;
  const totalExpenseBs = expenseBs + exchangeOutBs;

  const balanceUSD = totalIncomeUSD - totalExpenseUSD;
  const balanceBs = totalIncomeBs - totalExpenseBs;

  return (
    <div className="p-4 md:p-8 space-y-6 relative min-h-full">
      <header>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm">Resumen general</p>
      </header>

      <div className="card-glass p-5 space-y-2">
        <p className="text-sm text-slate-400">Balance</p>
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs font-medium text-slate-500">Bs</span>
          <p className={`text-lg font-semibold ${balanceBs >= 0 ? 'text-blue-300/80' : 'text-red-300/80'}`}>
            {formatBs(balanceBs)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs font-medium text-slate-500">USD</span>
          <p className={`text-xl font-bold ${balanceUSD >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatUSD(balanceUSD)}
          </p>
        </div>
      </div>

      <Link
        href="/transactions"
        className="inline-block text-blue-400 hover:text-blue-300 transition-colors"
      >
        Ver transacciones →
      </Link>

      <div className="card-glass p-12 flex items-center justify-center border-dashed">
        <p className="text-slate-500">Gráficos disponibles próximamente (Etapa 4)</p>
      </div>

      <button
        onClick={() => router.push('/transactions?new=true')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
        title="Registrar una transacción"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
