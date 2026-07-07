'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatUSD, formatBs } from '@/lib/utils/currency';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

interface MonthlyData {
  month: string;
  type: string;
  total_usd: number;
  total_bs: number;
}

interface CategoryData {
  category: string;
  type: string;
  total_usd: number;
  total_bs: number;
}

interface SummaryData {
  income?: { total_usd: number; total_bs: number };
  expense?: { total_usd: number; total_bs: number };
  exchange?: { total_usd: number; total_bs: number };
}

type PeriodKey = 'all' | 'month' | '3months' | 'year' | 'custom';

function getPeriodDates(period: PeriodKey): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from = '';

  switch (period) {
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

const periodLabels: Record<PeriodKey, string> = {
  all: 'Todo',
  month: 'Este mes',
  '3months': '3 meses',
  year: 'Este año',
  custom: 'Personalizado',
};

export default function DashboardPage() {
  const router = useRouter();
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [byCategory, setByCategory] = useState<CategoryData[]>([]);
  const [summary, setSummary] = useState<SummaryData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (period === 'custom') {
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      } else {
        const { from, to } = getPeriodDates(period);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
      }

      const res = await fetch(`/api/dashboard/stats?${params}`);
      if (res.ok) {
        const json = await res.json();
        setMonthly(json.monthly);
        setByCategory(json.byCategory);
        setSummary(json.summary);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const chartData = monthly.reduce<Record<string, { month: string; income: number; expense: number }>>((acc, row) => {
    if (!acc[row.month]) acc[row.month] = { month: row.month, income: 0, expense: 0 };
    if (row.type === 'income') acc[row.month].income = row.total_usd;
    if (row.type === 'expense') acc[row.month].expense = row.total_usd;
    return acc;
  }, {});
  const chartValues = Object.values(chartData);

  const expenseCategories = byCategory
    .filter((c) => c.type === 'expense')
    .map((c) => ({ name: c.category, value: c.total_usd }))
    .filter((c) => c.value > 0);

  const incomeUSD = summary.income?.total_usd ?? 0;
  const expenseUSD = summary.expense?.total_usd ?? 0;
  const balanceUSD = incomeUSD - expenseUSD;
  const incomeBs = summary.income?.total_bs ?? 0;
  const expenseBs = summary.expense?.total_bs ?? 0;
  const balanceBs = incomeBs - expenseBs;

  return (
    <div className="p-4 md:p-8 space-y-6 relative min-h-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">Resumen general</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(periodLabels) as PeriodKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                period === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {periodLabels[key]}
            </button>
          ))}
        </div>
      </header>

      {period === 'custom' && (
        <div className="flex flex-wrap gap-3 items-end">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-xs text-slate-400">Ingresos</span>
          </div>
          <p className="text-lg font-semibold text-green-400">{formatUSD(incomeUSD)}</p>
          <p className="text-xs text-slate-500">{formatBs(incomeBs)}</p>
        </div>
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-400" />
            <span className="text-xs text-slate-400">Egresos</span>
          </div>
          <p className="text-lg font-semibold text-red-400">{formatUSD(expenseUSD)}</p>
          <p className="text-xs text-slate-500">{formatBs(expenseBs)}</p>
        </div>
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-blue-400" />
            <span className="text-xs text-slate-400">Balance</span>
          </div>
          <p className={`text-lg font-semibold ${balanceUSD >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatUSD(balanceUSD)}
          </p>
          <p className="text-xs text-slate-500">{formatBs(balanceBs)}</p>
        </div>
      </div>

      <Link
        href="/transactions"
        className="inline-block text-blue-400 hover:text-blue-300 transition-colors text-sm"
      >
        Ver transacciones →
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Ingresos vs Egresos (USD)</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Cargando...</div>
          ) : chartValues.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Sin datos para este periodo</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartValues}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => formatUSD(Number(value))}
                />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-glass p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Gastos por categoría (USD)</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Cargando...</div>
          ) : expenseCategories.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Sin gastos para este periodo</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {expenseCategories.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatUSD(Number(value))} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
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
