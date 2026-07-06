'use client';

import { formatUSD, formatBs } from '@/lib/utils/currency';

interface TransactionCardProps {
  transaction: {
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
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeConfig = {
  income: { label: 'Ingreso', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '💰' },
  expense: { label: 'Gasto', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '💸' },
  exchange: { label: 'Cambio', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '🔄' },
};

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export function TransactionCard({ transaction: tx, onEdit, onDelete }: TransactionCardProps) {
  const config = typeConfig[tx.type];
  const isExchange = tx.type === 'exchange';
  const isNormal = tx.currency_primary === 'USD';

  const renderAmount = () => {
    if (!isExchange) {
      return (
        <p className="text-lg font-bold text-white">
          {tx.currency_primary === 'USD' ? formatUSD(tx.amount_usd) : formatBs(tx.amount_bs)}
        </p>
      );
    }

    if (isNormal) {
      return (
        <p className="text-lg font-bold text-white">
          <span className="text-red-400">-{formatUSD(tx.amount_usd)}</span>
          {' ➔ '}
          <span className="text-emerald-400">+{formatBs(tx.amount_bs)}</span>
        </p>
      );
    }

    return (
      <p className="text-lg font-bold text-white">
        <span className="text-red-400">-{formatBs(tx.amount_bs)}</span>
        {' ➔ '}
        <span className="text-emerald-400">+{formatUSD(tx.amount_usd)}</span>
      </p>
    );
  };

  return (
    <div className={`card-glass p-4 border-l-4 ${config.border} space-y-2`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div>
            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
            {tx.category_name && (
              <p className="text-xs text-slate-500">{tx.category_name}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          {renderAmount()}
          <p className="text-xs text-slate-500">{formatDate(tx.transaction_date)}</p>
        </div>
      </div>

      {tx.description && (
        <p className="text-sm text-slate-400 line-clamp-2">{tx.description}</p>
      )}

      {/* Metadata contextual según tipo de comprobante */}
      {tx.receipt_type === 'invoice' && (tx.provider_name || tx.tax_id) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {tx.provider_name && (
            <span className="truncate max-w-[200px]">{tx.provider_name}</span>
          )}
          {tx.tax_id && (
            <span className="font-mono text-slate-400">{tx.tax_id}</span>
          )}
        </div>
      )}
      {tx.receipt_type === 'transfer' && (tx.transfer_provider || tx.transfer_operation) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {tx.transfer_provider && tx.transfer_provider !== 'Otros' && (
            <span>{tx.transfer_provider}</span>
          )}
          {tx.transfer_operation && (
            <span className="font-mono text-slate-400">Op. {tx.transfer_operation}</span>
          )}
        </div>
      )}

      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-1">
            {onEdit && (
              <button onClick={() => onEdit(tx.id)} className="text-sm text-blue-400 hover:text-blue-300 transition-colors" title="Editar">
                ✏️
              </button>
            )}
            {(onEdit && onDelete) && (
              <span className="text-sm text-slate-500">|</span>
            )}
            {onDelete && (
              <button onClick={() => onDelete(tx.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors" title="Eliminar">
                🗑️
              </button>
            )}
        </div>
      )}
    </div>
  );
}
