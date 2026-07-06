import { db } from '@/lib/db';
import { NextResponse, type NextRequest } from 'next/server';
import { CategorySchema } from '@/types/transaction';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    if (user.role !== 'admin') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const validation = CategorySchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { name, type } = validation.data;
    const res = await db.execute({
      sql: 'UPDATE categories SET name = ?, type = ? WHERE id = ? RETURNING *',
      args: [name, type, id]
    });

    if (res.rows.length === 0) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    return NextResponse.json({ data: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    if (user.role !== 'admin') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });

    const { id } = await params;
    const checkUse = await db.execute({
      sql: 'SELECT id FROM transactions WHERE category_id = ? LIMIT 1',
      args: [id]
    });

    if (checkUse.rows.length > 0) {
      return NextResponse.json({ error: 'No se puede eliminar la categoría porque está en uso por transacciones.' }, { status: 400 });
    }

    await db.execute({
      sql: 'DELETE FROM categories WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
