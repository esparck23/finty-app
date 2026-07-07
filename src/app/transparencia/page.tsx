'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatUSD, formatBs } from '@/lib/utils/currency';

interface SummaryRow {
  type: string;
  category: string;
  currency_primary: string;
  total_usd: number;
  total_bs: number;
  num_transactions: number;
}

const typeLabels: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  exchange: 'Cambio',
};

export default function TransparenciaPage() {
  const [data, setData] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/summary')
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalIncomeUSD = data
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + r.total_usd, 0);
  const totalExpenseUSD = data
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + r.total_usd, 0);
  const totalIncomeBs = data
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + r.total_bs, 0);
  const totalExpenseBs = data
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + r.total_bs, 0);
  const totalTx = data.reduce((s, r) => s + r.num_transactions, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Finty — Transparencia</h1>
          <p className="text-slate-400">
            Registro público de ingresos y egresos de fondos humanitarios
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <p className="text-xs text-slate-500 mb-1">Total Ingresos</p>
            <p className="text-xl font-bold text-green-400">{formatUSD(totalIncomeUSD)}</p>
            <p className="text-xs text-slate-500">{formatBs(totalIncomeBs)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <p className="text-xs text-slate-500 mb-1">Total Egresos</p>
            <p className="text-xl font-bold text-red-400">{formatUSD(totalExpenseUSD)}</p>
            <p className="text-xs text-slate-500">{formatBs(totalExpenseBs)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <p className="text-xs text-slate-500 mb-1">Transacciones</p>
            <p className="text-xl font-bold text-blue-400">{totalTx}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-slate-400 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-right">USD</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-right">Bs</th>
                  <th className="px-4 py-3 text-slate-400 font-medium text-right">#</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Cargando datos...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Sin datos disponibles
                    </td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
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
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {formatUSD(row.total_usd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {formatBs(row.total_bs)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">{row.num_transactions}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-600">
          <p>Datos extraídos directamente de la base de datos Finty.</p>
          <p className="mt-1">
            <Link href="/login" className="text-blue-500 hover:text-blue-400">
              Acceder al sistema
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
