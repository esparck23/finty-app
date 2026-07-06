import { db } from '@/lib/db';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';

const ADMIN_HASH = Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64!, 'base64').toString('utf-8');

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const isValid = await compare(password, ADMIN_HASH);

    if (!isValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE role = ? LIMIT 1',
      args: ['admin']
    });

    let userId = existing.rows[0]?.id;

    if (!userId) {
      const res = await db.execute({
        sql: "INSERT INTO users (full_name, role) VALUES (?, ?) RETURNING id",
        args: ['Administrador', 'admin']
      });
      userId = res.rows[0].id as string;
    }

    const response = NextResponse.json({ success: true, user: { id: userId, role: 'admin' } });
    response.cookies.set('auth_token', String(userId), {
      httpOnly: true,
      path: '/',
      maxAge: 86400,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
