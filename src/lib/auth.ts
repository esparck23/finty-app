import { cookies } from 'next/headers';
import { db } from './db';

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const result = await db.execute({
      sql: 'SELECT id, full_name, role FROM users WHERE id = ?',
      args: [token],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id as string,
      fullName: row.full_name as string,
      role: row.role as string,
    };
  } catch {
    return null;
  }
}
