import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateConditions: string[] = [];
  const dateArgs: string[] = [];
  if (from) {
    dateConditions.push('transaction_date >= ?');
    dateArgs.push(from);
  }
  if (to) {
    dateConditions.push('transaction_date <= ?');
    dateArgs.push(to);
  }
  const dateWhere = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

  try {
    const monthlyResult = await db.execute({
      sql: `SELECT
              strftime('%Y-%m', transaction_date) AS month,
              type,
              SUM(amount_usd) AS total_usd,
              SUM(amount_bs) AS total_bs
            FROM transactions
            WHERE user_id = ? AND type IN ('income', 'expense') ${dateWhere}
            GROUP BY month, type
            ORDER BY month ASC`,
      args: [user.id, ...dateArgs],
    });

    const categoryResult = await db.execute({
      sql: `SELECT
              c.name AS category,
              t.type,
              SUM(t.amount_usd) AS total_usd,
              SUM(t.amount_bs) AS total_bs
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? ${dateWhere}
            GROUP BY c.name, t.type
            ORDER BY total_usd DESC`,
      args: [user.id, ...dateArgs],
    });

    const summaryResult = await db.execute({
      sql: `SELECT
              type,
              SUM(amount_usd) AS total_usd,
              SUM(amount_bs) AS total_bs
            FROM transactions
            WHERE user_id = ? ${dateWhere}
            GROUP BY type`,
      args: [user.id, ...dateArgs],
    });

    const exchangeSplitResult = await db.execute({
      sql: `SELECT
              currency_primary,
              SUM(amount_usd) AS total_usd,
              SUM(amount_bs) AS total_bs
            FROM transactions
            WHERE user_id = ? AND type = 'exchange' ${dateWhere}
            GROUP BY currency_primary`,
      args: [user.id, ...dateArgs],
    });

    const monthly = monthlyResult.rows.map((r) => ({
      month: r.month as string,
      type: r.type as string,
      total_usd: Number(r.total_usd),
      total_bs: Number(r.total_bs),
    }));

    const byCategory = categoryResult.rows.map((r) => ({
      category: r.category as string,
      type: r.type as string,
      total_usd: Number(r.total_usd),
      total_bs: Number(r.total_bs),
    }));

    const summary: Record<string, { total_usd: number; total_bs: number }> = {};
    for (const row of summaryResult.rows) {
      summary[row.type as string] = {
        total_usd: Number(row.total_usd),
        total_bs: Number(row.total_bs),
      };
    }

    const exchangeByCurrency: Record<string, { total_usd: number; total_bs: number }> = {};
    for (const row of exchangeSplitResult.rows) {
      exchangeByCurrency[row.currency_primary as string] = {
        total_usd: Number(row.total_usd),
        total_bs: Number(row.total_bs),
      };
    }

    return NextResponse.json({ monthly, byCategory, summary, exchangeByCurrency });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
