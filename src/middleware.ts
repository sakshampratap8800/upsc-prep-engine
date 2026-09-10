import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SAKSHAM_TOKEN = process.env.SAKSHAM_SESSION_TOKEN || 'secure_saksham_session_token_v1';
const SHIVANGI_TOKEN = process.env.SHIVANGI_SESSION_TOKEN || 'secure_shivangi_session_token_v1';

const publicPaths = ['/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i)
  ) {
    return NextResponse.next();
  }

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('upsc_session');
  const isAuthenticated = sessionCookie && (sessionCookie.value === SAKSHAM_TOKEN || sessionCookie.value === SHIVANGI_TOKEN);

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
