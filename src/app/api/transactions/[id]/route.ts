import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { TransactionSchema } from '@/types/transaction';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;

  const existing = await db.execute({
    sql: 'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
    args: [id, user.id],
  });
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
  }

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
      sql: `UPDATE transactions
            SET type = ?, amount_usd = ?, amount_bs = ?, currency_primary = ?,
                category_id = ?, description = ?, transaction_date = ?,
                receipt_type = ?, provider_name = ?, tax_id = ?, document_type = ?,
                transfer_provider = ?, transfer_operation = ?,
                original_image_url = ?, processed_at = ?,
                updated_at = datetime('now')
            WHERE id = ?
            RETURNING *`,
      args: [
        validation.data.type,
        validation.data.amount_usd,
        validation.data.amount_bs,
        validation.data.currency_primary,
        validation.data.category_id,
        validation.data.description ?? null,
        validation.data.transaction_date,
        validation.data.receipt_type ?? null,
        validation.data.provider_name ?? null,
        validation.data.tax_id ?? null,
        validation.data.document_type ?? null,
        validation.data.transfer_provider ?? null,
        validation.data.transfer_operation ?? null,
        validation.data.original_image_url ?? null,
        validation.data.processed_at ?? null,
        id,
      ],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
    }

    const enriched = await db.execute({
      sql: `SELECT t.*, c.name AS category_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = ?`,
      args: [id],
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
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;

  const existing = await db.execute({
    sql: 'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
    args: [id, user.id],
  });
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
  }

  try {
    await db.execute({
      sql: `INSERT INTO audit_log (transaction_id, user_id, action, old_values)
            SELECT ?, ?, 'DELETE', json_object('type', type, 'amount_usd', amount_usd, 'amount_bs', amount_bs, 'category_id', category_id)
            FROM transactions WHERE id = ?`,
      args: [id, user.id, id],
    });

    await db.execute({
      sql: 'DELETE FROM transactions WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
