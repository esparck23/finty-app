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
              SUM(t.amount_usd) AS total_usd,
              SUM(t.amount_bs) AS total_bs,
              COUNT(*) AS num_transactions
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            ${dateWhere}
            GROUP BY t.type, c.name, t.currency_primary
            ORDER BY t.type, c.name`,
      args: dateArgs,
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
