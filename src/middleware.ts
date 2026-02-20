import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isWritePage = req.nextUrl.pathname.startsWith('/write');
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    // Redirect unauthenticated users to /auth
    if (isWritePage && !isLoggedIn) {
        return NextResponse.redirect(new URL('/auth', req.url));
    }

    // Redirect authenticated users away from /auth to /write
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/write', req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/write/:path*', '/auth'],
};
