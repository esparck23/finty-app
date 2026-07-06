'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { formatUSD, formatBs } from '@/lib/utils/currency';
import type { TransactionInput, Transaction } from '@/types/transaction';
import type { ScanResult } from '@/types/gemini';
import { ScannerPanel } from '@/components/scanner/ScannerPanel';

export default function TransactionsPage() {
  const {
    transactions, isLoading, fetchTransactions,
    createTransaction, updateTransaction, deleteTransaction,
  } = useTransactions();

  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanType, setScanType] = useState<'income' | 'expense' | null>(null);

  // Auto-abrir formulario si viene desde Dashboard con ?new=true
  useEffect(() => {
    if (window.location.search.includes('new=true')) {
      setShowForm(true);
      window.history.replaceState({}, '', '/transactions');
    }
  }, []);

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

  const handleSubmit = async (data: TransactionInput) => {
    setSubmitError(null);
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, data);
      } else {
        await createTransaction(data);
      }
      setScanResult(null);
      setScanType(null);
      setShowScanner(false);
      setShowForm(false);
      setEditingTx(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Error al guardar');
    }
  };

  const handleEdit = useCallback((id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    setEditingTx(tx);
    setShowForm(true);
    setSubmitError(null);
  }, [transactions]);

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTransaction(deletingId);
      setDeletingId(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Error al eliminar');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingTx(null);
    setSubmitError(null);
    setScanResult(null);
    setScanType(null);
    setShowScanner(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 relative min-h-full">
      <header>
        <h1 className="text-2xl font-bold text-white">Transacciones</h1>
        <p className="text-slate-400 text-sm">Historial completo de movimientos</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-glass p-5 space-y-2">
          <p className="text-sm text-slate-400">Total Ingresos</p>
          <div className="flex items-center gap-2">
            <span className="w-8 text-xs font-medium text-slate-500">Bs</span>
            <p className="text-lg font-semibold text-emerald-300/80">{formatBs(totalIncomeBs)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 text-xs font-medium text-slate-500">USD</span>
            <p className="text-xl font-bold text-emerald-400">{formatUSD(totalIncomeUSD)}</p>
          </div>
        </div>
        <div className="card-glass p-5 space-y-2">
          <p className="text-sm text-slate-400">Total Egresos</p>
          <div className="flex items-center gap-2">
            <span className="w-8 text-xs font-medium text-slate-500">Bs</span>
            <p className="text-lg font-semibold text-red-300/80">{formatBs(totalExpenseBs)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 text-xs font-medium text-slate-500">USD</span>
            <p className="text-xl font-bold text-red-400">{formatUSD(totalExpenseUSD)}</p>
          </div>
        </div>
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

      <section>
        {isLoading && transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="animate-pulse">Cargando transacciones...</p>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            isAdmin={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

      <button
        onClick={() => {
          setEditingTx(null);
          setShowForm(true);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
        title="Registrar una transacción"
      >
        <Plus size={28} />
      </button>

      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={cancelForm}
        >
          <div
            className="flex items-center justify-center min-h-full p-4 max-sm:p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 border border-white/10 shadow-2xl w-full max-w-xl flex flex-col max-sm:min-h-screen max-sm:rounded-none sm:max-h-[90vh] sm:rounded-2xl">
              <div className="flex items-center justify-between p-6 pb-0">
                <h2 className="text-xl font-bold text-white">
                  {editingTx ? 'Editar Transacción' : 'Nueva Transacción'}
                </h2>
                <button
                  onClick={cancelForm}
                  className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                {submitError && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{submitError}</p>}

                {/* Scanner Panel - Primer paso en creación */}
                {!editingTx && showScanner && !scanResult && (
                  <div className="mb-6">
                    <ScannerPanel
                      onApply={(result, type) => {
                        setScanResult(result);
                        setScanType(type);
                      }}
                      onCancel={() => {
                        setShowScanner(false);
                        setScanResult(null);
                        setScanType(null);
                      }}
                    />
                  </div>
                )}

                {/* Botón de activar escáner - Primer paso en creación */}
                {!editingTx && !showScanner && !scanResult && (
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="w-full py-3 border-2 border-dashed border-blue-500/30 rounded-xl text-blue-400 text-sm hover:bg-blue-500/5 transition-colors flex items-center justify-center gap-2 mb-6"
                  >
                    <span>📸</span>
                    <span>Escanear comprobante con IA</span>
                  </button>
                )}

                {/* TransactionForm con scanResult opcional */}
                {(!showScanner || scanResult) && (
                  <TransactionForm
                    key={editingTx?.id ?? 'new'}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    initialData={editingTx ? {
                      type: editingTx.type,
                      amount_usd: Number(editingTx.amount_usd),
                      amount_bs: Number(editingTx.amount_bs),
                      currency_primary: editingTx.currency_primary,
                      category_id: editingTx.category_id,
                      description: editingTx.description ?? '',
                      transaction_date: editingTx.transaction_date,
                    } : undefined}
                    scanResult={scanResult}
                    scanType={scanType}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <p className="text-white font-medium text-lg">¿Eliminar esta transacción?</p>
            <p className="text-sm text-slate-400">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20">
                {isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
