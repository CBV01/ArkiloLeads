import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

const protectedRoutes = ['/', '/leads', '/playbooks', '/templates', '/send', '/preview', '/analytics'];
const publicRoutes = ['/login', '/signup', '/api/auth/login', '/api/auth/signup', '/api/setup'];
const passkeyRoute = '/verify-passkey';

export default async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.includes(path);
    const isPublicRoute = publicRoutes.includes(path);
    const isPasskeyRoute = path === passkeyRoute;
    const isAdminRoute = path.startsWith('/admin');

    const cookie = req.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie).catch(() => null) : null;

    // 1. Not logged in -> redirect to login if protected
    if ((isProtectedRoute || isAdminRoute || isPasskeyRoute) && !session) {
        if (path.startsWith('/api')) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        // If it's an admin route, go to admin login
        if (isAdminRoute && path !== '/admin/login') {
            return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
        }

        // Universal login for others
        if (!isAdminRoute && !isPasskeyRoute && path !== '/login') {
            return NextResponse.redirect(new URL('/login', req.nextUrl));
        }
    }

    // 2. Logged in, not verified passkey -> redirect to verify-passkey
    // Skip for verify-passkey itself, logout, and admin (admin handles its own)
    if (session && !session.passkeyVerified && !isPasskeyRoute && !isPublicRoute && !isAdminRoute) {
        return NextResponse.redirect(new URL('/verify-passkey', req.nextUrl));
    }

    // 3. Admin protection
    if (isAdminRoute && path !== '/admin/login' && session?.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login?error=admin_required', req.nextUrl));
    }

    // 4. Logged in and verified -> redirect away from public or passkey
    // UNLESS we are specifically being told we need a different role (admin_required)
    if (session && session.passkeyVerified && (isPublicRoute || isPasskeyRoute) && !req.nextUrl.searchParams.has('error') && !path.startsWith('/api')) {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|.*\\.png$).*)'],
};
