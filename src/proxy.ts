import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const publicPaths = ['/login', '/api/health', '/api/auth/login', '/api/auth/logout', '/api/public', '/api/', '/transparencia'];
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const result = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [token]
    });

    if (result.rows.length === 0) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.png$).*)'],
};
