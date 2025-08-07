/**
 * Middleware for ThinkSpace Authentication and Route Protection
 *
 * This middleware handles authentication checks, route protection,
 * and security headers for the ThinkSpace application using NextAuth.js.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

// Define protected and public routes
const protectedRoutes = [
  '/',
  '/projects',
  '/areas',
  '/resources',
  '/notes',
  '/archive',
  '/chat',
  '/graph',
  '/search',
  '/profile',
  '/settings',
  '/api/projects',
  '/api/areas',
  '/api/resources',
  '/api/notes',
  '/api/chat',
  '/api/graph',
  '/api/search',
  '/api/upload'
];

const publicRoutes = [
  '/signin',
  '/signup',
  '/error',
  '/forgot-password',
  '/reset-password',
  '/api/auth'
];

const adminRoutes = [
  '/admin',
  '/api/admin'
];

export default withAuth(
  async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    // Skip middleware for NextAuth API routes
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    // Check if route is protected (exact match for root, startsWith for others)
    const isProtectedRoute = protectedRoutes.some(route => {
      if (route === '/') {
        return pathname === '/';
      }
      return pathname.startsWith(route);
    });

    const isPublicRoute = publicRoutes.some(route =>
      pathname.startsWith(route)
    );

    const isAdminRoute = adminRoutes.some(route =>
      pathname.startsWith(route)
    );

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !token) {
      const signInUrl = new URL('/signin', req.url);
      // Only set callbackUrl if it's not already a sign-in page to prevent loops
      if (!pathname.startsWith('/signin')) {
        signInUrl.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(signInUrl);
    }

    // Redirect authenticated users from auth pages to dashboard
    if (isPublicRoute && token && (pathname === '/signin' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Check admin access
    if (isAdminRoute && (!token || (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN'))) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Add security headers
    const response = NextResponse.next();

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "media-src 'self';"
    );

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow NextAuth API routes
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // Allow access to public routes
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Require authentication for protected routes (exact match for root, startsWith for others)
        if (protectedRoutes.some(route => {
          if (route === '/') {
            return pathname === '/';
          }
          return pathname.startsWith(route);
        })) {
          return !!token;
        }

        // Allow access to other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * But include API routes for authentication
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
