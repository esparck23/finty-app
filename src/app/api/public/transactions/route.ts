import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateConditions: string[] = [];
  const dateArgs: string[] = [];
  if (from) {
    dateConditions.push('t.transaction_date >= ?');
    dateArgs.push(from);
  }
  if (to) {
    dateConditions.push('t.transaction_date <= ?');
    dateArgs.push(to);
  }
  const dateWhere = dateConditions.length > 0 ? `WHERE ${dateConditions.join(' AND ')}` : '';

  try {
    const result = await db.execute({
      sql: `SELECT
              t.type,
              c.name AS category,
              t.currency_primary,
              t.amount_usd,
              t.amount_bs,
              t.transaction_date
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            ${dateWhere}
            ORDER BY t.transaction_date DESC, t.created_at DESC`,
      args: dateArgs,
    });

    const data = result.rows.map((row) => ({
      type: row.type,
      category: row.category,
      currency_primary: row.currency_primary,
      amount_usd: Number(row.amount_usd),
      amount_bs: Number(row.amount_bs),
      transaction_date: row.transaction_date,
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
