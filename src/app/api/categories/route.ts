import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { CategorySchema } from '@/types/transaction';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const result = await db.execute('SELECT * FROM categories ORDER BY name ASC');
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const validation = CategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { name, type } = validation.data;
    const res = await db.execute({
      sql: 'INSERT INTO categories (name, type) VALUES (?, ?) RETURNING *',
      args: [name, type]
    });

    return NextResponse.json({ data: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
