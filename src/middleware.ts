import { NextRequest, NextResponse } from 'next/server';

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'tehranroom_admin_secure_salt_2026_x89a';

async function verifySessionTokenEdge(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [base64Payload, signature] = parts;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(base64Payload));
    const computedSignature = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSignature !== signature) {
      return false;
    }

    const jsonStr = atob(base64Payload);
    const payload = JSON.parse(jsonStr);

    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public auth APIs and static assets unconditionally
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/bg_logo.png'
  ) {
    return NextResponse.next();
  }

  // 2. Read admin session cookie
  const sessionCookie = req.cookies.get('tr_admin_session')?.value;
  const isAuthenticated = await verifySessionTokenEdge(sessionCookie);

  // 3. If user is trying to access login page
  if (pathname === '/login') {
    if (isAuthenticated) {
      // Already authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/', req.url));
    }
    // Not authenticated, allow viewing login page
    return NextResponse.next();
  }

  // 4. For all other protected routes (dashboard, bookings, finance, hotels, rooms, etc.)
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز. لطفاً ابتدا با کلید امنیتی وارد شوید.' },
        { status: 401 }
      );
    }

    // Redirect unauthenticated web user to /login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const proxy = middleware;
export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-icon.png, bg_logo.png
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|bg_logo\\.png).*)',
  ],
};
