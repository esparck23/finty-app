import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const COTIZAVE_RATES = 'https://api.cotizave.com/v1/fx/rates';
const COTIZAVE_CURRENCIES = 'https://api.cotizave.com/v1/fx/bcv/currencies';
const USD_FALLBACK = 'https://dolar-bcv-api.vercel.app/api/dollar';

interface RateEntry {
  rate: number;
  source: string;
  date: string;
}

async function fetchCotizave(): Promise<Record<string, RateEntry>> {
  const apiKey = process.env.COTIZAVE_API_KEY;
  if (!apiKey) return {};

  const today = new Date().toISOString().split('T')[0];
  const result: Record<string, RateEntry> = {};

  try {
    const res = await fetch(COTIZAVE_RATES, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      const date = (data.fetched_at || '').split('T')[0] || today;
      const bcv = data.rates?.find((r: any) => r.market === 'reference');
      if (bcv?.mid) result.usd = { rate: bcv.mid, source: 'cotizave', date };
      const binance = data.rates?.find((r: any) => r.market === 'binance');
      if (binance?.mid) result.binance = { rate: binance.mid, source: 'cotizave', date };
    }
  } catch {
    console.warn('[exchange-rates] Cotizave main fetch failed');
  }

  try {
    const res2 = await fetch(COTIZAVE_CURRENCIES, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (res2.ok) {
      const data = await res2.json();
      if (data.rates?.EUR) {
        result.eur = { rate: data.rates.EUR, source: 'cotizave', date: data.reference_value_date || today };
      }
    }
  } catch {
    console.warn('[exchange-rates] Cotizave EUR fetch failed');
  }

  return result;
}

async function fetchDolarapi(): Promise<RateEntry | null> {
  try {
    const res = await fetch(USD_FALLBACK, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rate ?? null;
    if (!rate) return null;
    return { rate, source: 'dolarapi', date: new Date().toISOString().split('T')[0] };
  } catch {
    console.warn('[exchange-rates] dolarapi fetch failed');
    return null;
  }
}

async function getCached(sourceSuffix: string): Promise<RateEntry | null> {
  const rows = await db.execute({
    sql: "SELECT rate, source, date FROM exchange_rates WHERE source LIKE ? ORDER BY created_at DESC LIMIT 1",
    args: [`%${sourceSuffix}`],
  });
  if (rows.rows.length === 0) return null;
  return {
    rate: Number(rows.rows[0].rate),
    source: String(rows.rows[0].source).replace(/_.+$/, ''),
    date: String(rows.rows[0].date),
  };
}

async function getAnyCached(): Promise<Record<string, RateEntry>> {
  const rows = await db.execute({
    sql: "SELECT rate, source, date FROM exchange_rates ORDER BY created_at DESC",
  });
  const result: Record<string, RateEntry> = {};
  for (const row of rows.rows) {
    const src = String(row.source);
    const key = src.includes('_') ? src.split('_').pop()! : 'usd';
    if (!result[key]) {
      result[key] = {
        rate: Number(row.rate),
        source: src.replace(/_.+$/, ''),
        date: String(row.date),
      };
    }
  }
  return result;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const rates = await fetchCotizave();
    if (!rates.usd) {
      const fallback = await fetchDolarapi();
      if (fallback) rates.usd = fallback;
    }

    for (const [key, entry] of Object.entries(rates)) {
      try {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO exchange_rates (rate, source, date) VALUES (?, ?, ?)',
          args: [entry.rate, `${entry.source}_${key}`, entry.date],
        });
      } catch {
        console.warn(`[exchange-rates] cache fail for ${key}`);
      }
    }

    if (Object.keys(rates).length > 0) {
      return NextResponse.json({ rates });
    }

    const cached = await getAnyCached();
    if (Object.keys(cached).length > 0) {
      return NextResponse.json({ rates: cached, stale: true });
    }

    return NextResponse.json({ error: 'No hay tasas disponibles' }, { status: 502 });
  } catch (err: any) {
    console.error('[exchange-rates] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
