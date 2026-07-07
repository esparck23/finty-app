import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db.execute({
      sql: 'SELECT type, category, currency_primary, total_usd, total_bs, num_transactions FROM public_summary ORDER BY type, category',
      args: [],
    });

    const data = result.rows.map((row) => ({
      type: row.type,
      category: row.category,
      currency_primary: row.currency_primary,
      total_usd: Number(row.total_usd),
      total_bs: Number(row.total_bs),
      num_transactions: Number(row.num_transactions),
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
