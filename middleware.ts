import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/api/auth',
    '/',
    '/about',
    '/contact'
  ]

  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Allow public routes and API routes
  if (isPublicRoute || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // For protected routes, NextAuth will handle authentication
  // This middleware just ensures proper routing
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
