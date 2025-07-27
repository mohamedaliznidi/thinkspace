import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from './lib/session'

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard', '/roles', '/permissions', '/profile', '/settings', '/users', '/companies', '/facilities', '/units', '/parking', '/payments', '/reports', '/notifications', '/']
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === '/') {
      return path === '/'
    }
    return path.startsWith(route)
  })
  const isPublicRoute = publicRoutes.includes(path)

  // 3. Decrypt the session from the cookie (optimistic check only)
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)

  // 4. Redirect to /login if the user is not authenticated and trying to access a protected route
  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Redirect to / if the user is authenticated and trying to access public routes
  if (isPublicRoute && session?.userId && !req.nextUrl.pathname.startsWith('/')) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // Add security headers
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
