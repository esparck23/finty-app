'use client';

import { useState } from 'react';
import type { ScanResult } from '@/types/gemini';

interface ScanResultViewProps {
  result: ScanResult;
  preview: string | null;
  onApply: (type: 'income' | 'expense') => void;
  onRescan: () => void;
  onCancel: () => void;
}

function esTransferencia(scanResult: ScanResult): boolean {
  if (scanResult.receipt_type === 'transfer') return true;
  if (scanResult.receipt_type === 'invoice') return false;

  const raw = scanResult.raw_text?.toLowerCase() || '';
  const vendor = scanResult.vendor?.toLowerCase() || '';

  return !!(
    scanResult.operation ||
    scanResult.reference ||
    scanResult.number ||
    scanResult.payer ||
    scanResult.receiver ||
    scanResult.beneficiary ||
    scanResult.destination ||
    scanResult.origin ||
    scanResult.provider ||
    scanResult.transfer_provider ||
    scanResult.transfer_operation ||
    vendor.includes('banco') ||
    vendor.includes('pago') ||
    vendor.includes('transferencia') ||
    raw.includes('pago móvil') ||
    raw.includes('pago movil') ||
    raw.includes('transferencia') ||
    raw.includes('tpago') ||
    raw.includes('destino') ||
    raw.includes('referencia') ||
    raw.includes('beneficiario') ||
    raw.includes('pagador') ||
    raw.includes('receptor') ||
    raw.includes('operación') ||
    raw.includes('operacion')
  );
}

export function ScanResultView({
  result,
  preview,
  onApply,
  onRescan,
  onCancel,
}: ScanResultViewProps) {
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | null>(null);
  const [rescanAttempts, setRescanAttempts] = useState(0);
  const MAX_RESCAN_ATTEMPTS = 3;
  const isTransferencia = esTransferencia(result);
  const isRescanBlocked = rescanAttempts >= MAX_RESCAN_ATTEMPTS;

  const confidencePercent = Math.round(result.confidence * 100);
  const confidenceColor =
    confidencePercent >= 70
      ? 'text-emerald-400'
      : confidencePercent >= 40
      ? 'text-amber-400'
      : 'text-red-400';

  const canApply = isTransferencia ? selectedType !== null : true;

  const handleRescan = () => {
    if (isRescanBlocked) return;
    setRescanAttempts((prev) => prev + 1);
    onRescan();
  };

  return (
    <div className="card-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Resultado del escaneo</h3>
          <p className="text-xs text-slate-500">
            {isTransferencia ? 'Comprobante de transferencia detectado' : 'Factura detectada'}
          </p>
        </div>
        <span className={`text-2xl font-bold ${confidenceColor}`}>
          {confidencePercent}%
        </span>
      </div>

      {preview && (
        <div className="w-full max-h-40 overflow-hidden rounded-lg bg-black/30 border border-white/10">
          <img
            src={preview}
            alt="Comprobante escaneado"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        {result.amount != null && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-slate-500 mb-1">Monto</p>
            <p className="text-white font-bold">
              {result.currency === 'Bs' ? 'Bs ' : '$'}
              {result.amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
        {result.date && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-slate-500 mb-1">Fecha</p>
            <p className="text-white font-medium">{result.date}</p>
          </div>
        )}
        {result.vendor && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-slate-500 mb-1">Proveedor</p>
            <p className="text-white font-medium truncate">{result.vendor}</p>
          </div>
        )}
        {result.category_name && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-slate-500 mb-1">Categoría detectada</p>
            <p className="text-white font-medium">{result.category_name}</p>
          </div>
        )}
        {result.rif_ci && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 col-span-2">
            <p className="text-xs text-slate-500 mb-1">RIF</p>
            <p className="text-white font-medium font-mono">{result.rif_ci}</p>
          </div>
        )}
        {result.concept && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 col-span-2">
            <p className="text-xs text-slate-500 mb-1">Concepto</p>
            <p className="text-white font-medium">{result.concept}</p>
          </div>
        )}
      </div>

      {/* Selector de tipo solo para transferencias */}
      {isTransferencia && (
        <div className="space-y-3">
          <p className="text-base font-medium text-slate-300 text-center">
            ¿Es un ingreso o un gasto?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedType('income')}
              className={`flex-1 py-3 rounded-xl font-semibold text-base transition-all ${
                selectedType === 'income'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent hover:border-emerald-500/30'
              }`}
            >
              💰 Ingreso
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('expense')}
              className={`flex-1 py-3 rounded-xl font-semibold text-base transition-all ${
                selectedType === 'expense'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent hover:border-red-500/30'
              }`}
            >
              💸 Gasto
            </button>
          </div>
        </div>
      )}

      {isRescanBlocked && (
        <div className="text-center space-y-2">
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Has alcanzado el límite de 3 re-escaneos. Completa los datos manualmente en el formulario.
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          disabled={!canApply}
          onClick={() => onApply(isTransferencia ? selectedType! : 'expense')}
          className={`btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          ✅ Aplicar al formulario
        </button>
        <button
          type="button"
          disabled={isRescanBlocked}
          onClick={handleRescan}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            isRescanBlocked
              ? 'bg-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
          }`}
        >
          🔄 Re-escanear ({MAX_RESCAN_ATTEMPTS - rescanAttempts}/3)
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
      >
        ❌ Descartar y llenar manual
      </button>
    </div>
  );
}
