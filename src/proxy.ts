import { NextResponse, type NextRequest } from 'next/server';

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

  return NextResponse.next();
}

export const config = {
  // Excluye todo lo que Next.js necesita internamente:
  // _next (static, data, RSC payloads), íconos, sw, manifests y assets.
  matcher: ['/((?!_next|favicon.ico|icons|sw\.js|sw-register|manifest\.webmanifest|manifest\.json|.*\.(?:png|svg|ico|webp|woff2?|css)$).*)'],
};
