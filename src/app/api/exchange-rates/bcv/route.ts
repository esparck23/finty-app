import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const COTIZAVE_RATES = 'https://api.cotizave.com/v1/fx/rates';
const USD_FALLBACK = 'https://dolar-bcv-api.vercel.app/api/dollar';

async function fetchCotizaveUsd(): Promise<{ dolar: number; date: string } | null> {
  const apiKey = process.env.COTIZAVE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(COTIZAVE_RATES, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      const bcv = data.rates?.find((r: any) => r.market === 'reference');
      if (bcv?.mid) {
        return { dolar: bcv.mid, date: (data.fetched_at || '').split('T')[0] };
      }
    }
  } catch {
    console.warn('[exchange-rates/bcv] Cotizave fetch failed');
  }
  return null;
}

async function fetchDolarapi(): Promise<{ dolar: number; date: string } | null> {
  try {
    const res = await fetch(USD_FALLBACK, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const dolar = data?.rate ?? null;
      if (dolar) {
        return { dolar, date: new Date().toISOString().split('T')[0] };
      }
    }
  } catch {
    console.warn('[exchange-rates/bcv] dolarapi fetch failed');
  }
  return null;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const today = new Date().toISOString().split('T')[0];
    let live = await fetchCotizaveUsd();

    if (!live) {
      live = await fetchDolarapi();
    }

    if (live) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO exchange_rates (rate, source, date) VALUES (?, ?, ?)',
        args: [live.dolar, `cotizave_usd`, live.date],
      });
      return NextResponse.json({ dolar: live.dolar, source: 'cotizave', date: live.date });
    }

    const lastKnown = await db.execute({
      sql: "SELECT rate, source, date FROM exchange_rates WHERE source LIKE '%usd' ORDER BY created_at DESC LIMIT 1",
    });

    if (lastKnown.rows.length > 0) {
      return NextResponse.json({
        dolar: lastKnown.rows[0].rate,
        source: String(lastKnown.rows[0].source).replace(/_.+$/, ''),
        date: lastKnown.rows[0].date,
        stale: true,
      });
    }

    return NextResponse.json({ error: 'No hay tasas disponibles' }, { status: 502 });
  } catch (err: any) {
    console.error('[exchange-rates/bcv] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
