import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { TransactionSchema } from '@/types/transaction';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const categoryId = searchParams.get('category_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const conditions: string[] = ['t.user_id = ?'];
  const args: (string | number)[] = [user.id];

  if (type) {
    conditions.push('t.type = ?');
    args.push(type);
  }
  if (categoryId) {
    conditions.push('t.category_id = ?');
    args.push(categoryId);
  }
  if (from) {
    conditions.push('t.transaction_date >= ?');
    args.push(from);
  }
  if (to) {
    conditions.push('t.transaction_date <= ?');
    args.push(to);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM transactions t WHERE ${where}`,
    args,
  });
  const total = Number(countResult.rows[0].count);

  const dataResult = await db.execute({
    sql: `SELECT t.*, c.name AS category_name
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE ${where}
          ORDER BY t.created_at ASC
          LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });

  const transactions = dataResult.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    amount_usd: row.amount_usd,
    amount_bs: row.amount_bs,
    currency_primary: row.currency_primary,
    category_id: row.category_id,
    category_name: row.category_name,
    description: row.description,
    receipt_url: row.receipt_url,
    transaction_date: row.transaction_date,
    receipt_type: row.receipt_type ?? null,
    provider_name: row.provider_name ?? null,
    tax_id: row.tax_id ?? null,
    document_type: row.document_type ?? null,
    transfer_provider: row.transfer_provider ?? null,
    transfer_operation: row.transfer_operation ?? null,
    original_image_url: row.original_image_url ?? null,
    processed_at: row.processed_at ?? null,
    is_offline_sync: Boolean(row.is_offline_sync),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return NextResponse.json({
    data: transactions,
    pagination: { page, limit, total },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json();
  const validation = TransactionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO transactions (user_id, type, amount_usd, amount_bs, currency_primary, category_id, description, receipt_url, transaction_date, receipt_type, provider_name, tax_id, document_type, transfer_provider, transfer_operation, original_image_url, processed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [
        user.id,
        validation.data.type,
        validation.data.amount_usd,
        validation.data.amount_bs,
        validation.data.currency_primary,
        validation.data.category_id,
        validation.data.description ?? null,
        validation.data.receipt_url || null,
        validation.data.transaction_date,
        validation.data.receipt_type ?? null,
        validation.data.provider_name ?? null,
        validation.data.tax_id ?? null,
        validation.data.document_type ?? null,
        validation.data.transfer_provider ?? null,
        validation.data.transfer_operation ?? null,
        validation.data.original_image_url ?? null,
        validation.data.processed_at ?? null,
      ],
    });

    const row = result.rows[0];

    const enriched = await db.execute({
      sql: `SELECT t.*, c.name AS category_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = ?`,
      args: [row.id],
    });
    const e = enriched.rows[0];

    return NextResponse.json({
      data: {
        id: e.id,
        user_id: e.user_id,
        type: e.type,
        amount_usd: e.amount_usd,
        amount_bs: e.amount_bs,
        currency_primary: e.currency_primary,
        category_id: e.category_id,
        category_name: e.category_name,
        description: e.description,
        receipt_url: e.receipt_url,
        transaction_date: e.transaction_date,
        receipt_type: e.receipt_type ?? null,
        provider_name: e.provider_name ?? null,
        tax_id: e.tax_id ?? null,
        document_type: e.document_type ?? null,
        transfer_provider: e.transfer_provider ?? null,
        transfer_operation: e.transfer_operation ?? null,
        original_image_url: e.original_image_url ?? null,
        processed_at: e.processed_at ?? null,
        is_offline_sync: Boolean(e.is_offline_sync),
        created_at: e.created_at,
        updated_at: e.updated_at,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
