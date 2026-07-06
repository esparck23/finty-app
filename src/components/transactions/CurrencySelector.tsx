'use client';

import { useState, useCallback, useEffect } from 'react';

interface CurrencySelectorProps {
  currency: 'USD' | 'Bs';
  onCurrencyChange: (c: 'USD' | 'Bs') => void;
  amountUsd: number;
  amountBs: number;
  onAmountUsdChange: (v: number) => void;
  onAmountBsChange: (v: number) => void;
}

function toValidNumber(raw: string): number {
  if (raw === '') return 0;
  const val = parseFloat(raw);
  return isNaN(val) ? 0 : Math.max(0, val);
}

export function CurrencySelector({
  currency,
  onCurrencyChange,
  amountUsd,
  amountBs,
  onAmountUsdChange,
  onAmountBsChange,
}: CurrencySelectorProps) {
  const [rawUsd, setRawUsd] = useState(amountUsd > 0 ? String(amountUsd) : '');
  const [rawBs, setRawBs] = useState(amountBs > 0 ? String(amountBs) : '');

  useEffect(() => {
    setRawUsd(amountUsd > 0 ? String(amountUsd) : '');
  }, [amountUsd]);

  useEffect(() => {
    setRawBs(amountBs > 0 ? String(amountBs) : '');
  }, [amountBs]);

  const commitUsd = useCallback(() => {
    const n = toValidNumber(rawUsd);
    onAmountUsdChange(n);
    setRawUsd(n > 0 ? String(n) : '');
  }, [rawUsd, onAmountUsdChange]);

  const commitBs = useCallback(() => {
    const n = toValidNumber(rawBs);
    onAmountBsChange(n);
    setRawBs(n > 0 ? String(n) : '');
  }, [rawBs, onAmountBsChange]);

  const isUsd = currency === 'USD';
  const rawValue = isUsd ? rawUsd : rawBs;
  const setRawValue = isUsd ? setRawUsd : setRawBs;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (isUsd) commitUsd(); else commitBs();
            onCurrencyChange('USD');
          }}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            currency === 'USD'
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-slate-500'
          }`}
        >
          USD
        </button>
        <button
          type="button"
          onClick={() => {
            if (isUsd) commitUsd(); else commitBs();
            onCurrencyChange('Bs');
          }}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            currency === 'Bs'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 text-slate-500'
          }`}
        >
          Bs
        </button>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Monto ({currency})
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value)}
          onBlur={() => { if (isUsd) commitUsd(); else commitBs(); }}
          className="input-field text-2xl font-bold"
          placeholder={currency === 'USD' ? '0.00' : '0,00'}
        />
      </div>
    </div>
  );
}
