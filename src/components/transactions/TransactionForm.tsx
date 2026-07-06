'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransactionSchema, type TransactionInput } from '@/types/transaction';
import { CurrencySelector } from './CurrencySelector';
import type { ScanResult } from '@/types/gemini';

interface ExchangeRateOption {
  id: string;
  label: string;
  rate: number;
}

interface CategoryOption {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'exchange';
}

interface TransactionFormProps {
  initialData?: Partial<TransactionInput>;
  onSubmit: (data: TransactionInput) => Promise<void>;
  isLoading?: boolean;
  scanResult?: ScanResult | null;
  scanType?: 'income' | 'expense' | null;
}

type ExchangeDirection = 'usd_to_bs' | 'bs_to_usd';

export function TransactionForm({
  initialData,
  onSubmit,
  isLoading,
  scanResult,
  scanType,
}: TransactionFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateOption[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(false);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [exchangeTouched, setExchangeTouched] = useState(false);
const [isOtherBank, setIsOtherBank] = useState(false);
const [customBank, setCustomBank] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<TransactionInput | null>(null);
  const [detectedTransactionType, setDetectedTransactionType] = useState<'expense' | 'income' | 'exchange' | 'unknown'>('unknown');
  const [detectedCurrency, setDetectedCurrency] = useState<'USD' | 'Bs' | null>(null);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(TransactionSchema),
    values: {
      type: 'expense',
      currency_primary: 'Bs',
      amount_usd: 0,
      amount_bs: 0,
      category_id: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      receipt_type: null,
      provider_name: null,
      tax_id: null,
      document_type: null,
      transfer_provider: null,
      transfer_operation: null,
      ...initialData,
    },
  });

  const transactionType = form.watch('type');
  const currencyPrimary = form.watch('currency_primary');
  const receiptType = form.watch('receipt_type');
  const transferProvider = form.watch('transfer_provider');
  const isExchange = transactionType === 'exchange';
  const amountUsd = Number(form.watch('amount_usd'));
  const amountBs = Number(form.watch('amount_bs'));

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => { if (!r.ok) throw new Error('Error al cargar categorías'); return r.json(); })
      .then((json) => setCategories(json.data))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    if (!isExchange) {
      setExchangeRates([]);
      setSelectedRate(null);
      setRatesError(false);
      return;
    }
    setRatesLoading(true);
    fetch('/api/exchange-rates')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const list: ExchangeRateOption[] = [];
        if (data.rates?.usd) list.push({ id: 'bcv_usd', label: 'BCV USD', rate: data.rates.usd.rate });
        if (data.rates?.eur) list.push({ id: 'bcv_eur', label: 'BCV EUR', rate: data.rates.eur.rate });
        if (data.rates?.binance) list.push({ id: 'binance', label: 'Binance P2P', rate: data.rates.binance.rate });
        setExchangeRates(list);
        setRatesError(list.length === 0);
      })
      .catch(() => setRatesError(true))
      .finally(() => setRatesLoading(false));
  }, [isExchange]);

  const VENEZUELAN_BANKS = [
  'Banco de Venezuela',
  'BBVA Provincial',
  'Mercantil Banco',
  'Banesco',
  'Banco Nacional de Crédito (BNC)',
  'Banco Exterior',
  'Banco Caroní',
  'Banco Plaza',
  '100% Banco',
  'Banco del Tesoro',
  'Banco Agrícola',
  'Banco Bicentenario',
  'Banco del Pueblo Soberano',
  'Banco de la Fuerza Armada (BANFANB)',
  'Banco Activo',
  'Bancamiga',
  'Banplus',
  'BOD (Banco Occidental de Descuento)',
  'Banco Fondo Común (BFC)',
  'Banco Sofitasa',
  'Pago Móvil',
  'Binance',
  'Otros',
] as const;

const exchangeDirection: ExchangeDirection = currencyPrimary === 'USD' ? 'usd_to_bs' : 'bs_to_usd';

  const filteredCategories = categories.filter((c) => c.type === transactionType);

  useEffect(() => {
    if (!categoriesLoading && initialData?.category_id) {
      form.setValue('category_id', initialData.category_id);
    }
  }, [categoriesLoading, initialData?.category_id, form]);

  useEffect(() => {
    if (isExchange && !categoriesLoading && categories.length > 0 && !initialData?.category_id) {
      const exchangeCat = categories.find((c) => c.type === 'exchange');
      if (exchangeCat) {
        form.setValue('category_id', exchangeCat.id);
      }
    }
  }, [isExchange, categoriesLoading, categories, form, initialData?.category_id]);

  // Inicializar customBank si el valor actual no está en la lista de bancos
  useEffect(() => {
    const current = form.getValues('transfer_provider');
    if (current && !VENEZUELAN_BANKS.includes(current as any)) {
      setCustomBank(current);
      setIsOtherBank(true);
      form.setValue('transfer_provider', 'Otros');
    }
  }, [form]);

  // Aplicar scanResult al formulario
  useEffect(() => {
    if (!scanResult || categoriesLoading) return;

    // 1. Establecer el tipo detectado desde scanType (viene del ScanResultView)
    if (scanType) {
      setDetectedTransactionType(scanType);
      form.setValue('type', scanType);
    }

    // 2. Aplicar monto y moneda
    if (scanResult.amount != null) {
      if (scanResult.currency === 'USD') {
        form.setValue('amount_usd', scanResult.amount);
        form.setValue('amount_bs', 0);
        form.setValue('currency_primary', 'USD');
        setDetectedCurrency('USD');
      } else if (scanResult.currency === 'Bs') {
        form.setValue('amount_usd', 0);
        form.setValue('amount_bs', scanResult.amount);
        form.setValue('currency_primary', 'Bs');
        setDetectedCurrency('Bs');
      }
    }

    // 3. Aplicar fecha
    if (scanResult.date) {
      form.setValue('transaction_date', scanResult.date);
    }

    // 4. Aplicar concepto
    if (scanResult.concept) {
      form.setValue('description', scanResult.concept);
    }

    // 5. Aplicar categoría con matching mejorado
    if (scanResult.category_name) {
      const normalizedScanCat = scanResult.category_name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '');

      const exactMatch = categories.find(c =>
        c.name.toLowerCase() === normalizedScanCat
      );

      if (exactMatch) {
        form.setValue('category_id', exactMatch.id);
      } else {
        const keywordMatch = categories.find(c => {
          const normalizedCat = c.name.toLowerCase().replace(/[^\w\s]/g, '');
          const keywords = normalizedScanCat.split(/\s+/);
          return keywords.some(keyword => normalizedCat.includes(keyword) || normalizedCat.includes(keyword.replace(/é|í|ó|ú|ñ/g, '')));
        });

        if (keywordMatch) {
          form.setValue('category_id', keywordMatch.id);
        } else {
          const genericMatch = categories.find(c => {
            const normalizedCategory = c.name.toLowerCase().replace(/[^\w\s]/g, '');
            return normalizedCategory.includes('general') ||
                   normalizedCategory.includes('otro') ||
                   normalizedCategory.includes('otros') ||
                   normalizedCategory.includes('transferencia');
          });

          if (genericMatch) {
            form.setValue('category_id', genericMatch.id);
          }
        }
      }
    }

    // 5b. Si es ingreso por transferencia, forzar categoría "Transferencia recibida"
    if (scanType === 'income' && scanResult.receipt_type === 'transfer') {
      const transferCategory = categories.find(c => c.name === 'Transferencia recibida');
      if (transferCategory) {
        form.setValue('category_id', transferCategory.id);
      }
    }

    // 6. Aplicar campos de comprobante (receipt metadata)
    if (scanResult.receipt_type) {
      form.setValue('receipt_type', scanResult.receipt_type);
    }
    if (scanResult.provider_name) {
      form.setValue('provider_name', scanResult.provider_name);
    }
    if (scanResult.rif_ci) {
      form.setValue('tax_id', scanResult.rif_ci);
    }
    if (scanResult.document_type) {
      form.setValue('document_type', scanResult.document_type);
    }
    if (scanResult.transfer_provider) {
      form.setValue('transfer_provider', scanResult.transfer_provider);
    }
    if (scanResult.transfer_operation) {
      form.setValue('transfer_operation', scanResult.transfer_operation);
    }

  }, [scanResult, categoriesLoading, categories, form, scanType]);

  const applyRate = (rateId: string, rateValue: number) => {
    setSelectedRate(rateId);
    if (exchangeDirection === 'usd_to_bs') {
      if (amountUsd > 0) {
        form.setValue('amount_bs', Math.round(amountUsd * rateValue * 100) / 100);
      }
    } else {
      if (amountBs > 0) {
        form.setValue('amount_usd', Math.round((amountBs / rateValue) * 100) / 100);
      }
    }
  };

  const handleOriginChange = (val: number) => {
    setExchangeTouched(true);
    if (exchangeDirection === 'usd_to_bs') {
      form.setValue('amount_usd', val);
      if (selectedRate && val > 0) {
        const rate = exchangeRates.find((r) => r.id === selectedRate)?.rate;
        if (rate) {
          form.setValue('amount_bs', Math.round(val * rate * 100) / 100);
        }
      } else if (val === 0) {
        form.setValue('amount_bs', 0);
      }
    } else {
      form.setValue('amount_bs', val);
      if (selectedRate && val > 0) {
        const rate = exchangeRates.find((r) => r.id === selectedRate)?.rate;
        if (rate) {
          form.setValue('amount_usd', Math.round((val / rate) * 100) / 100);
        }
      } else if (val === 0) {
        form.setValue('amount_usd', 0);
      }
    }
  };

  const handleDestinationChange = (val: number) => {
    if (exchangeDirection === 'usd_to_bs') {
      form.setValue('amount_bs', val);
    } else {
      form.setValue('amount_usd', val);
    }
    setSelectedRate(null);
  };

  const handleFormSubmit = async (data: TransactionInput) => {
    if (isExchange && exchangeTouched) {
      setPendingData(data);
      setShowConfirm(true);
      return;
    }

    // Validación condicional: si hay número de operación, banco es obligatorio
    if (data.receipt_type === 'transfer' && data.transfer_operation && !data.transfer_provider) {
      form.setError('transfer_provider', {
        type: 'manual',
        message: 'Selecciona el banco o plataforma',
      });
      return;
    }

    await onSubmit(data);
  };

  const confirmExchange = async () => {
    if (pendingData) {
      setShowConfirm(false);
      setPendingData(null);
      setExchangeTouched(false);
      await onSubmit(pendingData);
    }
  };

  // Determinar qué botones deben bloquearse
  const getIsButtonLocked = (buttonType: 'income' | 'expense' | 'exchange') => {
    // Si estamos editando y es exchange, bloqueamos los otros tipos
    if (initialData?.type === 'exchange' && buttonType !== 'exchange') {
      return true;
    }
    
    // Si hay scanResult y detectó un tipo específico, bloquear los demás
    if (scanResult && detectedTransactionType !== 'unknown') {
      return buttonType !== detectedTransactionType;
    }
    
    return false;
  };

  // Determinar qué moneda debe bloquearse en el CurrencySelector
  const getIsCurrencyLocked = (currency: 'USD' | 'Bs') => {
    // Si detectamos moneda en el scanner, bloquear la otra
    if (scanResult && detectedCurrency) {
      return currency !== detectedCurrency;
    }
    
    return false;
  };

  const isNormal = exchangeDirection === 'usd_to_bs';
  const originLabel = isNormal ? 'Monto (USD)' : 'Monto (Bs)';
  const destLabel = isNormal ? 'Monto (Bs)' : 'Monto (USD)';
  const originValue = isNormal ? amountUsd : amountBs;
  const destValue = isNormal ? amountBs : amountUsd;
  const originColor = isNormal ? 'text-green-400' : 'text-blue-400';
  const destColor = isNormal ? 'text-blue-400' : 'text-green-400';
  const originPlaceholder = isNormal ? '0.00' : '0,00';
  const destPlaceholder = isNormal ? '0,00' : '0.00';
  const confirmQuestion = isNormal
    ? '¿Estás de acuerdo con el monto en bolívares calculado?'
    : '¿Estás de acuerdo con el monto en dólares calculado?';

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-3 gap-2">
          {(['income', 'expense', 'exchange'] as const).map((t) => {
            const isLocked = getIsButtonLocked(t);
            return (
              <button
                key={t}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  form.setValue('type', t);
                  if (t === 'exchange') form.setValue('currency_primary', 'USD');
                }}
                className={`py-3 rounded-xl font-medium transition-all ${
                  isLocked
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                    : transactionType === t
                    ? t === 'income'
                      ? 'bg-emerald-600 text-white'
                      : t === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {t === 'income' ? '💰 Ingreso' : t === 'expense' ? '💸 Gasto' : '🔄 Cambio'}
              </button>
            );
          })}
        </div>

        {isExchange ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!!initialData && !isNormal}
                onClick={() => form.setValue('currency_primary', 'USD')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  isNormal
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                    : !!initialData
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
                }`}
              >
                USD ➔ Bs
              </button>
              <button
                type="button"
                disabled={!!initialData && isNormal}
                onClick={() => form.setValue('currency_primary', 'Bs')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isNormal
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                    : !!initialData
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
                }`}
              >
                Bs ➔ USD
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">{originLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={originValue || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    handleOriginChange(val);
                  }}
                  className={`input-field text-2xl font-bold ${originColor}`}
                  placeholder={originPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">{destLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={destValue || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    handleDestinationChange(val);
                  }}
                  className={`input-field text-2xl font-bold ${destColor}`}
                  placeholder={destPlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Tasa de Referencia</label>
              {ratesLoading ? (
                <div className="text-center py-3 text-slate-500 text-sm animate-pulse">
                  Cargando tasas...
                </div>
              ) : ratesError || exchangeRates.length === 0 ? (
                <div className="text-center py-3 text-slate-500 text-sm">
                  Tasas no disponibles
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {exchangeRates.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => applyRate(r.id, r.rate)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedRate === r.id
                          ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <span className="block text-xs text-slate-500">{r.label}</span>
                      <span className="block text-sm font-bold">{r.rate.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <CurrencySelector
            currency={currencyPrimary}
            onCurrencyChange={(c) => form.setValue('currency_primary', c)}
            amountUsd={amountUsd}
            amountBs={amountBs}
            onAmountUsdChange={(v) => form.setValue('amount_usd', v)}
            onAmountBsChange={(v) => form.setValue('amount_bs', v)}
          />
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-2">Categoría</label>
          <div className="relative">
            <select
              {...form.register('category_id')}
              className="input-field appearance-none pr-10"
              disabled={categoriesLoading || isExchange}
            >
              <option value="">{categoriesLoading ? 'Cargando...' : 'Seleccionar...'}</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {form.formState.errors.category_id && (
            <p className="text-red-400 text-sm mt-1">
              {form.formState.errors.category_id.message}
            </p>
          )}
        </div>

        {!isExchange && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Descripción</label>
            <textarea
              {...form.register('description')}
              className="input-field min-h-[80px] resize-none"
              placeholder="Detalle del gasto o ingreso..."
            />
          </div>
        )}

        {receiptType === 'invoice' && (
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Datos de Factura</p>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Proveedor</label>
              <input
                type="text"
                {...form.register('provider_name')}
                className="input-field"
                placeholder="Nombre del comercio..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">RIF</label>
                <input
                  type="text"
                  {...form.register('tax_id')}
                  className="input-field"
                  placeholder="J-12345678-9"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo Documento</label>
                <div className="relative">
                  <select
                    {...form.register('document_type')}
                    className="input-field appearance-none pr-10"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="rif">RIF</option>
                    <option value="ci">CI</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {receiptType === 'transfer' && (
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Datos de Transferencia</p>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Banco / Plataforma</label>
              <div className="relative">
                <select
                  value={isOtherBank ? 'Otros' : (transferProvider ?? '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Otros') {
                      setIsOtherBank(true);
                      setCustomBank('');
                      form.setValue('transfer_provider', 'Otros');
                    } else {
                      setIsOtherBank(false);
                      setCustomBank('');
                      form.setValue('transfer_provider', val);
                    }
                  }}
                  className="input-field appearance-none pr-10"
                >
                  <option value="">Seleccionar...</option>
                  {VENEZUELAN_BANKS.filter(b => b !== 'Otros').map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                  <option value="Otros">Otros</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {isOtherBank && (
                <input
                  type="text"
                  value={customBank}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomBank(val);
                    form.setValue('transfer_provider', val || 'Otros');
                  }}
                  className="input-field mt-2"
                  placeholder="Especifica el banco o plataforma..."
                  autoFocus
                />
              )}
              {form.formState.errors.transfer_provider && (
                <p className="text-red-400 text-sm mt-1">
                  {form.formState.errors.transfer_provider.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nro. Operación / Referencia</label>
              <input
                type="text"
                {...form.register('transfer_operation')}
                className="input-field"
                placeholder="Número de operación..."
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-2">Fecha</label>
          <input
            type="date"
            {...form.register('transaction_date')}
            className="input-field"
            onFocus={(e) => e.target.showPicker()}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : '✅ Guardar Transacción'}
        </button>
      </form>

      {showConfirm && pendingData && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <p className="text-white font-medium text-lg">Confirmar Cambio de Divisas</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">Monto (USD)</span>
                <span className="text-white font-bold">${pendingData.amount_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Monto (Bs)</span>
                <span className="text-white font-bold">Bs {pendingData.amount_bs.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs">{confirmQuestion}</p>
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => { setShowConfirm(false); setPendingData(null); }}
                className="px-4 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmExchange}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
