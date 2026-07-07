import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db.execute({
      sql: 'SELECT id, rate, source, date, created_at FROM exchange_rates ORDER BY date DESC, created_at DESC LIMIT 30',
      args: [],
    });

    const data = result.rows.map((row) => ({
      id: row.id,
      rate: Number(row.rate),
      source: row.source,
      date: row.date,
      created_at: row.created_at,
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
