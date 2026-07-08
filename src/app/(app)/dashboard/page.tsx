'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Copy, Check } from 'lucide-react';
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

interface ExchangeByCurrency {
  [key: string]: { total_usd: number; total_bs: number };
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

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatMonthES(ym: string): string {
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  return `${MONTHS_ES[parseInt(m, 10) - 1]} ${y}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [byCategory, setByCategory] = useState<CategoryData[]>([]);
  const [summary, setSummary] = useState<SummaryData>({});
  const [exchangeByCurrency, setExchangeByCurrency] = useState<ExchangeByCurrency>({});
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [chartCurrency, setChartCurrency] = useState<'USD' | 'Bs'>('USD');
  const [shareCopied, setShareCopied] = useState(false);

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
        setExchangeByCurrency(json.exchangeByCurrency ?? {});
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

  const usdKey = 'total_usd' as const;
  const bsKey = 'total_bs' as const;
  const amtKey = chartCurrency === 'USD' ? usdKey : bsKey;
  const fmt = chartCurrency === 'USD' ? formatUSD : formatBs;
  const currencyLabel = chartCurrency === 'USD' ? 'USD' : 'Bs';

  const chartData = monthly.reduce<Record<string, { month: string; monthLabel: string; income: number; expense: number }>>((acc, row) => {
    if (!acc[row.month]) acc[row.month] = { month: row.month, monthLabel: formatMonthES(row.month), income: 0, expense: 0 };
    if (row.type === 'income') acc[row.month].income = row[amtKey];
    if (row.type === 'expense') acc[row.month].expense = row[amtKey];
    return acc;
  }, {});
  const chartValues = Object.values(chartData);

  const expenseCategories = byCategory
    .filter((c) => c.type === 'expense')
    .map((c) => ({ name: c.category, value: c[amtKey] }))
    .filter((c) => c.value > 0);

  const incomeUSD = summary.income?.total_usd ?? 0;
  const expenseUSD = summary.expense?.total_usd ?? 0;
  const incomeBs = summary.income?.total_bs ?? 0;
  const expenseBs = summary.expense?.total_bs ?? 0;

  const exchangeOutUSD = exchangeByCurrency['USD']?.total_usd ?? 0;
  const exchangeInBs = exchangeByCurrency['USD']?.total_bs ?? 0;
  const exchangeInUSD = exchangeByCurrency['Bs']?.total_usd ?? 0;
  const exchangeOutBs = exchangeByCurrency['Bs']?.total_bs ?? 0;

  const totalIncomeUSD = incomeUSD + exchangeInUSD;
  const totalExpenseUSD = expenseUSD + exchangeOutUSD;
  const totalIncomeBs = incomeBs + exchangeInBs;
  const totalExpenseBs = expenseBs + exchangeOutBs;

  const balanceUSD = totalIncomeUSD - totalExpenseUSD;
  const balanceBs = totalIncomeBs - totalExpenseBs;

  return (
    <div className="p-4 md:p-8 space-y-6 relative min-h-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">Resumen general</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
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

      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <Link
        href="/transactions"
        className="inline-block text-blue-400 hover:text-blue-300 transition-colors text-sm"
      >
        Ver transacciones →
      </Link>

      <div className="border-t border-white/10" />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-400">Gráficos según tipo de moneda:</span>
        {(['Bs', 'USD'] as const).map((cur) => (
          <button
            key={cur}
            onClick={() => setChartCurrency(cur)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              chartCurrency === cur
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cur}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Ingresos vs Egresos ({currencyLabel})</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Cargando...</div>
          ) : chartValues.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Sin datos para este periodo</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartValues}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="monthLabel" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => fmt(Number(value))}
                />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-glass p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Gastos por categoría ({currencyLabel})</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Cargando...</div>
          ) : expenseCategories.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Sin gastos para este periodo</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                >
                  {expenseCategories.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(Number(value))} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          const url = `${window.location.origin}/transparencia`;
          navigator.clipboard.writeText(url).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
          });
        }}
        className="fixed bottom-8 left-4 md:left-8 card-glass px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer group"
        title="Copiar enlace público de Transparencia"
      >
        {shareCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400 group-hover:text-white" />}
        <span className="text-xs text-slate-400 group-hover:text-white">
          {shareCopied ? 'Copiado' : 'Copiar enlace público de Transparencia'}
        </span>
      </button>

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
